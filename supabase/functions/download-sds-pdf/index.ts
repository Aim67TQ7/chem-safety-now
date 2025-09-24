
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface DownloadRequest {
  document_id: string;
  source_url: string;
  file_name: string;
}

// Function to ensure storage bucket exists
async function ensureStorageBucket() {
  const bucketName = 'sds-documents';
  
  // Check if bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
  
  if (!bucketExists) {
    console.log('📦 Creating sds-documents storage bucket...');
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['application/pdf'],
      fileSizeLimit: 52428800 // 50MB limit
    });
    
    if (createError) {
      console.error('❌ Failed to create storage bucket:', createError);
      throw new Error(`Failed to create storage bucket: ${createError.message}`);
    }
    
    console.log('✅ Successfully created sds-documents storage bucket');
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { document_id, source_url, file_name }: DownloadRequest = await req.json();
    
    console.log('📥 Starting PDF download for document:', document_id);
    console.log('📥 Source URL:', source_url);

    // Ensure storage bucket exists
    await ensureStorageBucket();

    // Step 1: Download the PDF from the source URL
    const response = await fetch(source_url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SDS-Downloader/1.0)',
        'Accept': 'application/pdf,*/*'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    console.log('📄 Content type:', contentType);

    // Verify it's a PDF
    if (!contentType.includes('application/pdf') && !source_url.toLowerCase().includes('.pdf')) {
      throw new Error('Downloaded content is not a PDF document');
    }

    // Get the PDF as bytes
    const pdfBytes = await response.arrayBuffer();
    console.log('📊 PDF size:', pdfBytes.byteLength, 'bytes');

    if (pdfBytes.byteLength === 0) {
      throw new Error('Downloaded PDF is empty');
    }

    // Step 2: Generate a unique file path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedFileName = file_name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFileName = `${timestamp}_${sanitizedFileName}`;
    const filePath = `pdfs/${uniqueFileName}`;

    console.log('💾 Uploading to bucket path:', filePath);

    // Step 3: Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('sds-documents')
      .upload(filePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    console.log('✅ Upload successful:', uploadData.path);

    // Step 4: Get the public URL
    const { data: urlData } = supabase.storage
      .from('sds-documents')
      .getPublicUrl(filePath);

    const bucketUrl = urlData.publicUrl;
    console.log('🔗 Public URL:', bucketUrl);

    // Step 5: Update the document record with bucket URL and file info
    // Store the complete URL for easy access
    const { error: updateError } = await supabase
      .from('sds_documents')
      .update({
        bucket_url: bucketUrl, // This is already the full URL from getPublicUrl
        file_size: pdfBytes.byteLength,
        file_type: 'application/pdf'
      })
      .eq('id', document_id);

    if (updateError) {
      console.error('❌ Database update error:', updateError);
      // Don't throw here, the file is uploaded successfully
      console.warn('⚠️ File uploaded but database update failed');
    }

    // Step 6: Trigger text extraction (background task)
    // Note: Background tasks will continue after response is sent
    (async () => {
      console.log('🔍 Triggering text extraction...');
      try {
        const { error: extractionError } = await supabase.functions.invoke('extract-sds-text', {
          body: {
            document_id: document_id,
            bucket_url: bucketUrl
          }
        });

        if (extractionError) {
          console.error('❌ Text extraction failed:', extractionError);
        } else {
          console.log('✅ Text extraction initiated successfully');
        }
      } catch (extractionError) {
        console.error('❌ Text extraction error:', extractionError);
      }
    })();

    console.log('✅ PDF download and storage completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        bucket_url: bucketUrl,
        file_path: filePath,
        file_size: pdfBytes.byteLength,
        message: 'PDF downloaded and stored successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ PDF download error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Failed to download and store PDF'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

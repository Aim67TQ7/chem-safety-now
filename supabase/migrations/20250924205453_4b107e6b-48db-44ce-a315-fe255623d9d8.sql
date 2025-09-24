-- Add missing interaction records for uploaded documents
INSERT INTO sds_interactions (facility_id, sds_document_id, action_type, metadata, created_at)
VALUES 
  ('76bb87b6-2acf-431d-af3b-0706be1dada4', '2ccb5f52-d400-4709-a957-64dab1d0072e', 'upload', '{"upload_source": "facility_upload", "file_name": "hd10.pdf"}', '2025-09-24 20:03:44.102+00'),
  ('76bb87b6-2acf-431d-af3b-0706be1dada4', 'c8c79c3d-4dcd-4fdc-ac74-97f2c1771b43', 'upload', '{"upload_source": "facility_upload", "file_name": "hc10.pdf"}', '2025-09-24 20:03:42.438+00'),
  ('76bb87b6-2acf-431d-af3b-0706be1dada4', '4abd1ad5-0fed-4bcf-a409-592f4170bed2', 'upload', '{"upload_source": "facility_upload", "file_name": "dx10.pdf"}', '2025-09-24 20:03:40.762+00'),
  ('76bb87b6-2acf-431d-af3b-0706be1dada4', '8756173e-c1ec-4963-813f-49efb7bf2cbf', 'upload', '{"upload_source": "facility_upload", "file_name": "alk200yl.pdf"}', '2025-09-24 20:03:18.955+00'),
  ('76bb87b6-2acf-431d-af3b-0706be1dada4', '5029705f-a154-4b1a-bcda-73db90ec3b76', 'upload', '{"upload_source": "facility_upload", "file_name": "alk200r.pdf"}', '2025-09-24 20:03:17.163+00');
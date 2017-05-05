# Use Koel with Google Cloud Storage

Based on koel-aws.

This has been tested only on virtual machine hosted on Google Cloud Platform.

It works, but as for now only with my fork Tajmahal86/koel.


1. Create a bucket, e.g. `koel-bucket`

    gsutil mb koel-bukcet
	
2. Make sure vm has the right scope of permissions for reading objecs from bucket, you might need to authenticate gcloud with a service account.

3. Edit the domain you'll be serving Koel from in cors-json-file.json file to allow CORS on `koel-bucket`

    gsutil cors set cors-json-file.json gs://koel-bukcet

As of current, only `mp3`, `ogg`, and `m4a` files are supported. Also, your Koel version must be v3.0.0 or later.

1. Clone this repository: 
    
    git clone https://github.com/tajamahal86/koel-gcp
	
2. Install necessary packages: 

    cd koel-gcp && npm install --production
	 
3. Copy `.env.example` into `.env` and edit the variables there

4. Deploy the function

    gcloud beta functions deploy notifyUploaded --stage-bucket cloud_functions_bucket --trigger-bucket  koel_music_bucket
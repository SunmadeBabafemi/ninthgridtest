## Description

A high-performance file upload service designed to handle large files (5MB and above) efficiently without compromising system performance. The service includes user authentication and allows users to manage their uploaded files seamlessly.

## API Documentation
1. url: https://documenter.getpostman.com/view/15148492/2sB2cbbesX,
2. base_url: https://{{domain}}:{{port}}/ninthgrid/v1 (eg. http://localhost:2026/ninthgrid/v1)
3. the verify OTP api has two examples ( account validation, forgot password) for proper guidance

## Installation

```bash
$ npm install
```

## Run Migration

```bash
$ npm run migration
```
or
```bash
$ npm run migration:latest
```
## Considerations
Plug in all environment variables before running the app

## Notes 
1. Google Cloud Serivce was used for the cloud storage
2. cloudinary was initially considered as an alternative but was expunged upon completion of the task
3. I could not get KnexJs to work with mongodb so i used mongoose in stead but Knexjs for mysql query interractions
4. the keys.json file was left empty for security reasons and you will need to use your own keys to make use of the upload functionality
5. Redis was used in the upload progress monitoring


## Running the app

```bash
# development
$ npm run dev

```
## Author
Babafemi Olasunmade


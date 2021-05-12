# gatsby-s3-action

**Deploy a Gatsby site to an AWS S3 bucket and optionally invalidate a CloudFront distribution**

- Support Gatsby v2 & v3 🚀
- Copies a Gatsby site to the root of an S3 bucket (uses `sync --delete` so old files in the bucket will be removed - can be disabled by using `sync-delete: false`, see [Parameters Reference](#parameters-reference)).
- Sets cache headers as defined by the rules described in the [Gatsby documentation](https://www.gatsbyjs.org/docs/caching/).
- Fast - uses AWS Cli commands for mass file operations which only create/modify files as needed.
- Suitable for hosting with or without CloudFront. If a CloudFront distribution is specified then it will be invalidated after deployment.

Please read the notes on the [AWS Setup](#aws-setup) below.

For a full step by step guide for setting up from scratch please take a look at [GitHub Actions powered Gatsby AWS how-to guide](https://blog.elantha.com/gatsby-s3-cloudfront/).

### QUICK RECIPE: S3 Static Hosting, no CloudFront

```yml
name: Deploy

on:
  push:
    branches:
      - main            # could be 'master' on older repos
jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Use Node.js
        uses: actions/setup-node@v2
        with:
          node-version: 14
      - name: Build
        run: |
          npm ci
          npm run build
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-west-2
      - name: Deploy
        uses: jonelantha/gatsby-s3-action@v1
        with:
          dest-s3-bucket: your_bucket
```

- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` are obtained from the AWS console, see [AWS IAM Secrets](#aws-iam-secrets) below.
- `your_bucket` should be changed to the name of your bucket
- See [Parameters Reference](#parameters-reference) below for the full list of parameters

### QUICK RECIPE: With CloudFront

Add the `cloudfront-id-to-invalidate` parameter to specify the ID of a distribution to be invalidated after deployment.

```yaml
     - name: Deploy
        uses: jonelantha/gatsby-s3-action@v1
        with:
          dest-s3-bucket: your_bucket
          cloudfront-id-to-invalidate: CLOUDFRONTID
```

### QUICK RECIPE: Deploy to a sub-directory on S3

Add the `dest-s3-path` parameter to specify a sub-directory to copy to in your bucket.

```yaml
     - name: Deploy
        uses: jonelantha/gatsby-s3-action@v1
        with:
          dest-s3-bucket: your_bucket
          dest-s3-path: blog/files
```

### QUICK RECIPE: With a non-standard Gatsby build directory (default is ./public/):

Gatsby builds to ./public by default. If you've changed the build directory to something else then use `public-source-path` to specify that directory:

```yaml
     - name: Deploy
        uses: jonelantha/gatsby-s3-action@v1
        with:
          dest-s3-bucket: your_bucket
          public-source-path: ./build/
```

## AWS Setup

### AWS IAM Secrets

You'll need to [setup an AWS IAM user](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html) with `Programmatic Access` and then configure the `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` in the Settings/Secrets area of the repo. Ideally you should follow [Amazon IAM best practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html) and grant least privileges to the user:
  - `s3:ListBucket` on `arn:aws:s3:::your_bucket`
  - `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on `arn:aws:s3:::your_bucket/*`
  - *(only if you're using CloudFront)* `cloudfront:CreateInvalidation` on `arn:aws:cloudfront::YOURACCOUNT_ID:distribution/YOURCLOUDFRONTID`

_For a complete walkthrough of setting up the user, please see the first section of the associated [Setting up Github Actions for Gatsby](https://blog.elantha.com/gatsby-github-actions/) guide_

### S3

- With CloudFront:
  - The S3 bucket does not need to be set for public access but the CloudFront distribution should have access to your bucket, see the [CloudFront](#cloudfront) section below.
- Without CloudFront, S3 Static Website hosting only:
  - Use these S3 Static Website Hosting settings:
    - **Index Document**: `index.html`
    - **Error Document**: `404.html`

### CloudFront

Your CloudFront distribution will need read access to your S3 bucket. More information in the [AWS Gatsby S3 CloudFront guide](https://blog.elantha.com/gatsby-s3-cloudfront/) but in short this is easy to configure when you create your CloudFront distribution, just make sure you use the following settings on the **Create Distribution** screen:

- **Origin Access Identity**: `Create New Identity`
- **Grant Read Permissions on Bucket**: `Yes Update Bucket Policy`

Also, you'll need to setup a [CloudFront Function](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-functions.html) on the CloudFront distribution to properly handle serving up `index.html` files.  More information in the [Gatsby CloudFront Function guide](https://blog.elantha.com/cloudfront-function-index-handling/). Alternatively if you'd prefer to set up index handling using a [lambda@edge](https://aws.amazon.com/lambda/edge/) function, please see the [Gatsby CloudFront Lambda guide](https://blog.elantha.com/cloudfront-index-lambda/)

## Redirects

If you plan to use Gatsby redirects you'll need to use a Gatsby redirect plugin such as one of the following:
- [gatsby-plugin-client-side-redirect](https://www.gatsbyjs.org/packages/gatsby-plugin-client-side-redirect/)
- [gatsby-plugin-meta-redirect](https://www.gatsbyjs.org/packages/gatsby-plugin-meta-redirect/)

## Parameters Reference

| Argument | Status | Description |
|--------|-------|------------|
| dest-s3-bucket | Required | The destination S3 Bucket |
| dest-s3-path | Optional | The destination S3 Path (defaults to root) |
| cloudfront-id-to-invalidate | Optional | The ID of the CloudFront distribution to invalidate. |
| cloudfront-path-to-invalidate | Optional | The path to invalidate on the CloudFront distribution. See the [CloudFront Invalidation guide](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html) for information on the format (default: `/*`) |
| public-source-path | Optional | The path to your gatsby ./public directory. Default: is `./public/` |
| sync-delete | Optional | Boolean: delete files on S3 not in the latest Gatsby build (defaults to 'true') |
| browser-cache-duration | Optional | The cache duration (in seconds) to instruct browsers to cache files for. This is only for files which should be cached as per [Gatsby caching recommendations](https://www.gatsbyjs.org/docs/caching/). Default is 31536000 (1 year) |
| cdn-cache-duration | Optional | The cache duration (in seconds) to instruct a CDN (if there is one) to cache files for. If on a development environment and you want to avoid issuing CloudFront invalidations you could set this to 0. Default is 31536000 (1 year) |
| debug | Optional | Boolean: enable debug logging (defaults to 'false') |

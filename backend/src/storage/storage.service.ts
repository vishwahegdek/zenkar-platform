import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';

@Injectable()
export class StorageService implements OnModuleInit {
  private minioClient: Minio.Client;
  private readonly logger = new Logger(StorageService.name);
  
  // Public URL base for generating links
  private readonly publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT || 'http://localhost:9000';

  constructor() {
    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ROOT_USER || 'admin',
      secretKey: process.env.MINIO_ROOT_PASSWORD || 'password',
    });
  }

  async onModuleInit() {
    await this.ensureBucket('zenkar-raw');
    await this.ensureBucket('zenkar-assets');
    // Enforce public policy for assets bucket to ensure existing buckets get updated
    await this.setPublicPolicy('zenkar-assets');
  }

  async ensureBucket(bucketName: string) {
    try {
      const exists = await this.minioClient.bucketExists(bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(bucketName, 'us-east-1');
        this.logger.log(`Bucket created: ${bucketName}`);
        
        // precise policy to allow public read for assets?
        // keeping it private by default for now, but usually for web assets we want public read.
        if (bucketName === 'zenkar-assets') {
          await this.setPublicPolicy(bucketName);
        }
      }
    } catch (err) {
      this.logger.error(`Error checking bucket ${bucketName}: ${err.message}`);
    }
  }

  async setPublicPolicy(bucketName: string) {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucketName}/*`],
        },
      ],
    };
    await this.minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
    this.logger.log(`Public read policy set for ${bucketName}`);
  }

  async upload(bucket: string, key: string, buffer: Buffer, meta: any = {}) {
    await this.minioClient.putObject(bucket, key, buffer, buffer.length, meta);
    this.logger.log(`Uploaded ${key} to ${bucket}`);
  }

  getPublicUrl(bucket: string, key: string): string {
    // Construct public URL
    // e.g. http://localhost:9000/zenkar-assets/key
    return `${this.publicEndpoint}/${bucket}/${key}`;
  }
}

import { Controller, Post, UploadedFile, UseInterceptors, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Response } from 'express';
import { extname } from 'path';
import { FileService } from './file.service';
import * as fs from 'fs';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}


  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    // In case of large scale/storage files, it's recommended to put the file in the server first.
    storage: diskStorage({
      destination: './uploads',  // Directory to save the uploaded file
      filename: (req, file, cb) => {
        // Generate a unique filename
        const fileExtName = extname(file.originalname);
        const randomName = Array(32)
          .fill(null)
          .map(() => Math.round(Math.random() * 16).toString(16))
          .join('');
        cb(null, `${randomName}${fileExtName}`);
      },
    }),
  }))
  async uploadCSV(@UploadedFile() file: Express.Multer.File, @Res() res: Response) {

    try {
      // Perform file processing here (splitting CSV, zipping, etc.)
      const zippedFile = await this.fileService.processCSV(file);

      // Send the zipped file as a download
      res.download(zippedFile, (err) => {
        if (err) {
          console.error('Error downloading file:', err); // TODO: To be deleted
          res.status(500).send('Error downloading file');
        } else {

          // Delete the zip file after download
          fs.unlink(zippedFile, (err) => {
            if (err) {
              console.error(`Error deleting zip file: ${zippedFile}`, err);
            } else {
              console.log(`Successfully deleted zip file: ${zippedFile}`);
            }
          });
          console.log(`Successfull downloaded`); // TODO: To be deleted
        }
      });
    } catch (error) {
      console.error('Error processing the file:', error.message);      
      res.status(500).json({ message: 'Error processing file', error: error.message });
    }
  }
}
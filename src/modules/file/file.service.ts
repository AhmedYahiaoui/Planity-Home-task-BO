import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as csvParser from 'csv-parser';
import * as archiver from 'archiver';
import * as path from 'path';

@Injectable()
export class FileService {
  async processCSV(file: Express.Multer.File): Promise<string> {
    const uploadedFilePath = file.path;
    const uploadsDir = path.join(__dirname, '../../..', 'uploads');

    const maleFilePath = path.join(uploadsDir, 'male.csv');
    const femaleFilePath = path.join(uploadsDir, 'female.csv');

    const maleSteam = fs.createWriteStream(maleFilePath);
    const femaleStream = fs.createWriteStream(femaleFilePath);

    return new Promise((resolve, reject) => {
      console.log(' ... Processing CSV file:', file.filename);

    // Write headers to both files
    const csvHeader = 'uid,firstName,lastName,gender,date,randomString1,randomString2,randomString3,randomString4,randomString5,randomString6,randomString7\n' 
    maleSteam.write(csvHeader);
    femaleStream.write(csvHeader);

      // Read and process the input CSV file
      fs.createReadStream(uploadedFilePath)
        .pipe(csvParser())
        .on('data', (row) => {
          
          const csvValue = `${row.uid},${row.firstName},${row.lastName},${row.gender},${row.date},${row.randomString1},${row.randomString2},${row.randomString3},${row.randomString4},${row.randomString5},${row.randomString6},${row.randomString7}\n`;
          const gender = row.gender?.trim().toLowerCase();

          // Check the gender and write to the appropriate file
          if (gender === 'male') {
            maleSteam.write(csvValue);
          } else if (gender === 'female') {
            femaleStream.write(csvValue);
          }
        })
        .on('end', async () => {

        // Close streams after finishing writing
        maleSteam.end();
        femaleStream.end();

        // Zip the resulting files
          const zipPath = path.join(uploadsDir, 'csv-files.zip');
          const archive = this.zipFiles(zipPath,[maleFilePath,femaleFilePath]);

        try {
          await archive.finalize();
          console.log(`Zipping completed`); // TODO : To be deleted

          // Delete the original file after processing
          this.deleteFiles(uploadedFilePath);

          // Delete the male.csv after processing
          this.deleteFiles(maleFilePath);

          // Delete the female.csv after processing
          this.deleteFiles(femaleFilePath);

          resolve(zipPath);
        } catch (zipError) {
          console.error('zipError: ', zipError);
          reject(zipError);
        }
        })
        .on('error',(error)=>{
          console.error('Error during CSV processing: ', error);
          reject(error);
        } );
    });
  }

  zipFiles( zipPath: string, files: string[]) {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(output);

    for (let index = 0; index < files.length; index++) {
      const fileName = files[index].substring(files[index].lastIndexOf('/') + 1);
      archive.file(files[index], { name: fileName });
    }
    return archive;
  }

  deleteFiles(filePath: string){
    const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Error deleting file: ${fileName}`, err);
      } else {
        console.log(`Successfully deleted file: ${fileName}`);
      }
    });
  }
}

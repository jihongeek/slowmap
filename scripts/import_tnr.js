"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const iconv_lite_1 = __importDefault(require("iconv-lite"));
const csvFilePath = '/Users/jihongkim/Downloads/길고양이 중성화사업(TNR).csv';
const dbFilePath = path_1.default.join(process.cwd(), 'tnr.db');
// Initialize Database
const db = new better_sqlite3_1.default(dbFilePath);
// Create Table
db.exec(`
  DROP TABLE IF EXISTS tnr_data;
  CREATE TABLE tnr_data (
    id TEXT PRIMARY KEY,
    sido TEXT,
    sigungu TEXT,
    capture_date TEXT,
    capture_place TEXT,
    color TEXT,
    weight REAL,
    breed TEXT,
    age TEXT,
    gender TEXT,
    health TEXT,
    note TEXT,
    status TEXT,
    tnr_date TEXT,
    tnr_hospital TEXT,
    release_date TEXT,
    release_place TEXT,
    end_info TEXT,
    capture_image TEXT,
    tnr_before_image TEXT,
    tnr_after_image TEXT,
    release_image TEXT
  );
`);
const insert = db.prepare(`
  INSERT INTO tnr_data (
    id, sido, sigungu, capture_date, capture_place, color, weight, breed, age, gender, health, note, status, tnr_date, tnr_hospital, release_date, release_place, end_info, capture_image, tnr_before_image, tnr_after_image, release_image
  ) VALUES (
    @id, @sido, @sigungu, @capture_date, @capture_place, @color, @weight, @breed, @age, @gender, @health, @note, @status, @tnr_date, @tnr_hospital, @release_date, @release_place, @end_info, @capture_image, @tnr_before_image, @tnr_after_image, @release_image
  )
`);
const results = [];
console.log('Reading CSV file...');
fs_1.default.createReadStream(csvFilePath)
    .pipe(iconv_lite_1.default.decodeStream('euc-kr'))
    .pipe((0, csv_parser_1.default)())
    .on('data', (data) => {
    // Map CSV columns to DB columns
    // CSV headers: 관리번호,사업지역(시도),사업지역(시군구),포획일자,포획장소,털색,몸무게(kg),품종,연령,성별,건강상태,특이사항,상태,TNR일자,TNR병원,방사일자,방사장소,종결정보,포획사진,중성화사진(수술전),중성화사진(수술후),방사사진
    results.push({
        id: data['관리번호'],
        sido: data['사업지역(시도)'],
        sigungu: data['사업지역(시군구)'],
        capture_date: data['포획일자'],
        capture_place: data['포획장소'],
        color: data['털색'],
        weight: parseFloat(data['몸무게(kg)']) || null,
        breed: data['품종'],
        age: data['연령'],
        gender: data['성별'],
        health: data['건강상태'],
        note: data['특이사항'],
        status: data['상태'],
        tnr_date: data['TNR일자'],
        tnr_hospital: data['TNR병원'],
        release_date: data['방사일자'],
        release_place: data['방사장소'],
        end_info: data['종결정보'],
        capture_image: data['포획사진'],
        tnr_before_image: data['중성화사진(수술전)'],
        tnr_after_image: data['중성화사진(수술후)'],
        release_image: data['방사사진']
    });
})
    .on('end', () => {
    console.log(`Parsed ${results.length} rows. Inserting into database...`);
    const insertMany = db.transaction((rows) => {
        for (const row of rows) {
            insert.run(row);
        }
    });
    insertMany(results);
    console.log('Data successfully inserted into SQLite database.');
    db.close();
})
    .on('error', (err) => {
    console.error('Error reading CSV:', err);
});

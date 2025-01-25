const express = require('express');
const multer = require('multer');
const ExcelJS = require('exceljs');
const mongoose = require('mongoose');
const fs = require('fs');
const cors = require('cors');
const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB 연결 설정 (데이터베이스 이름: pretty)
const uri = 'mongodb+srv://sihyeong:tlguddl1Wkd!@cluster0.ae74r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0' ;

mongoose.connect(uri)
  .then(() => console.log('MongoDB Atlas 연결 성공'))
  .catch(err => console.error('MongoDB Atlas 연결 실패:', err));

// mongoose.connect('mongodb://localhost:27017/pretty', { useNewUrlParser: true, useUnifiedTopology: true });

// 컬렉션 스키마 및 모델 설정 (컬렉션 이름: ratePlan)
const Schema = mongoose.Schema;
const ratePlanSchema = new Schema({
  '코드': { type: String },
  '통신사': { type: String },
  'RM,RS': { type: String },
  '요금제명': { type: String },
  '음성': { type: String },
  '문자': { type: String },
  '데이터': { type: String },
  '기본료': { type: Number }
}, { strict: false });
const RatePlanModel = mongoose.model('ratePlan', ratePlanSchema);

async function readExcel(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  const filteredData = [];
  let startReading = false;
  let startRow, startCol, keys;

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      if (cell.value === '통신사') {
        startReading = true;
        startRow = rowNumber + 1;
        startCol = colNumber;
        keys = row.values.slice(startCol).map(String);
      }
    });

    if (startReading && rowNumber >= startRow) {
      const rowData = {};
      row.eachCell((cell, colNumber) => {
        if (colNumber >= startCol) {
          rowData[keys[colNumber - startCol]] = cell.value;
        }
      });
      filteredData.push(rowData);
    }
  });

  console.log(filteredData);
  return filteredData;
}

async function saveData(filteredData) {
  for (const data of filteredData) {
    const existingData = await RatePlanModel.findOne({ Code: data.Code });
    if (!existingData) {
      await RatePlanModel.create(data);
      console.log('저장된 데이터:', data);
    } else {
      console.log('중복된 데이터 생략:', data);
    }
  }
  console.log('모든 데이터 저장 완료');
}

app.post('/upload', upload.single('file'), async (req, res) => {
  const filePath = req.file.path;
  try {
    const filteredData = await readExcel(filePath);
    await saveData(filteredData);
    res.status(200).send('파일 업로드 및 데이터 저장 완료');
  } catch (error) {
    console.error(error);
    res.status(500).send('서버 오류');
  } finally {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('파일 삭제 오류:', err);
      } else {
        console.log('파일 삭제 완료:', filePath);
      }
    });
  }
});

app.get('/stw-cgi/:script', async (req, res) => {
  const { script } = req.params;
  const { action, code } = req.query;

  console.log('요청 URL:', req.originalUrl);
  console.log('스크립트:', script);
  console.log('액션:', action);
  console.log('코드:', code);

  // 요청 형식 검증
  if (!script.endsWith('.cgi')) {
    console.log('잘못된 요청 형식: script 형식이 .cgi로 끝나야 합니다.');
    return res.status(400).json({ error: '잘못된 요청 형식: script 형식이 .cgi로 끝나야 합니다.' });
  }

  if (action !== 'view' || !code) {
    console.log('잘못된 요청 형식: action=view 와 code 파라미터가 필요합니다.');
    return res.status(400).json({ error: '잘못된 요청 형식: action=view 와 code 파라미터가 필요합니다.' });
  }

  try {
    const result = await RatePlanModel.findOne({ '코드': code });
    console.log('조회 결과:', result);
    if (!result) {
      return res.status(404).json({ error: '일치하는 데이터가 없습니다.' });
    }
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '서버 오류' });
  }
});

app.listen(3000, () => {
  console.log('서버가 포트 3000번에서 시작되었습니다.');
});

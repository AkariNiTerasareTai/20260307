// ==========================================
// 柴咲あかり ファンサイト用 掲示板バックエンド (GAS)
// ==========================================
//
// 1. Googleドライブで新規スプレッドシートを作成し、「メッセージ板」などわかりやすい名前をつける
// 2. メニュー「拡張機能」＞「Apps Script」を開く
// 3. このファイル(gas_script.js)の中身をすべてコピーして、エディタに貼り付ける
// 4. メニューの「デプロイ」＞「新しいデプロイ」を選択
// 5. 種類の選択(歯車アイコン)から「ウェブアプリ」を選択
// 6. 「アクセスできるユーザー」を「全員」に変更して「デプロイ」をクリック
// 7. 発行された「ウェブアプリのURL」をコピーし、サイト側の main.js の TODO 箇所に設定する

const SHEET_NAME = 'シート1'; // 利用するシート名に合わせて変更してください

function doPost(e) {
    try {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
        const params = JSON.parse(e.postData.contents);

        const name = params.name || '名無し';
        const message = params.message || '';
        const date = new Date();

        // シートの最終行の次に追加 (A列: 日時, B列: 名前, C列: メッセージ)
        if (message.trim() !== '') {
            sheet.appendRow([date, name, message]);
        }

        return ContentService.createTextOutput(JSON.stringify({
            status: 'success',
            message: '書き込み完了'
        })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

function doGet(e) {
    try {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
        const lastRow = sheet.getLastRow();

        let data = [];
        if (lastRow > 0) {
            // 1行目がヘッダーだった場合を考慮し2行目から取得するか、ヘッダーなしなら1行目から取得
            // ここではヘッダーありと仮定して2行目から取得
            const startRow = lastRow > 1 ? 2 : 1;
            const numRows = lastRow - startRow + 1;

            if (numRows > 0) {
                const values = sheet.getRange(startRow, 1, numRows, 3).getValues();
                data = values.map(row => {
                    const d = new Date(row[0]);
                    const dateStr = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

                    return {
                        date: dateStr,
                        name: row[1],
                        text: row[2]
                    };
                });
            }
        }

        // 新しい順にするため反転
        data.reverse();

        return ContentService.createTextOutput(JSON.stringify({
            status: 'success',
            data: data
        })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

// CORS対応のためのOPTIONS受け付け
function doOptions(e) {
    return ContentService.createTextOutput("")
        .setMimeType(ContentService.MimeType.JSON)
        .setHeader("Access-Control-Allow-Origin", "*")
        .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

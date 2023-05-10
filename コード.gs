// LINEボットのアクセストークン
const LINE_TOKEN = PropertiesService.getScriptProperties().getProperty("LINE_TOKEN");

// LINE返信用エンドポイント
const REPLY_URL = 'https://api.line.me/v2/bot/message/reply';

// ChatGPTのAPI Key
const GPT_API_KEY = PropertiesService.getScriptProperties().getProperty("GPT_API_KEY");
// ChatGPT APIエンドポイント
const GPT_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const MODEL_NAME = 'gpt-3.5-turbo';
const MODEL_TEMP = 0.5;
const MAX_TOKENS = 1024;
// DALL-E エンドポイント
const DALLE_ENDPOINT = 'https://api.openai.com/v1/images/generations';

// Cloud Vision API key
const GOOGLE_API_KEY = PropertiesService.getScriptProperties().getProperty("GOOGLE_API_KEY");




// LINEからPostリクエストが送られてきた時に実行される処理
function doPost(e) {
  const event = JSON.parse(e.postData.contents).events[0];
  const replyToken = event.replyToken
  

  if(event.message.type == 'image') {
    try {
      const foodsImage = getImage(event.message.id);
      foodsImageBlob = foodsImage.getBlob();
      var foodsImageBase64 = Utilities.base64Encode(foodsImageBlob.getBytes());
      const foodNames = multiObjectDetection(foodsImageBase64);// 引数はbase64エンコードしたもの。返り値は食材の名前が入った配列

      var replyText = processGPT(replyToken, foodNames);// ChatGPTにレシピを作ってもらう
      var urlDALLEImage = requestDALLEImage(replyText);//　レシピの結果からDALLEに参考画像を生成してもらう
      lineReply(replyToken, replyText, urlDALLEImage);// ラインに生成結果を返信する

    }catch(e) {
      Logger.log(e);
    }
  }
  return
}



// 画像の取得
function getImage(id) {

  //画像取得用エンドポイント
  const url = 'https://api-data.line.me/v2/bot/message/' + id + '/content';
  const foodsImage = UrlFetchApp.fetch(url,{
    'method': 'get',
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization' :  'Bearer ' + LINE_TOKEN,
    }
  });

  return foodsImage;
}



// Vision APIで画像から食材を識別して結果を取得
function multiObjectDetection(foodsImageBase64) {
   const url = 'https://vision.googleapis.com/v1/images:annotate?key=' + GOOGLE_API_KEY;
   const body = {
       "requests": [
           {
               "image": {
                   "content": foodsImageBase64
               },
               "features": [
                   {
                       "type": "OBJECT_LOCALIZATION",
                   }
               ]
           }
       ]
   };

   const head = {
       "method": "post",
       "contentType": "application/json",
       "payload": JSON.stringify(body),
       "muteHttpExceptions": true
   };

   const response = UrlFetchApp.fetch(url, head);
   const obj = JSON.parse(response.getContentText());
   const annotations = obj.responses[0].localizedObjectAnnotations;

    const foodNames = annotations.map(annotation => annotation.name);

   return foodNames;
}



// dataはJSON形式で
function processGPT(replyToken, foodNames) {
  if (typeof replyToken === 'undefined') {return;}

  const str_food = foodNames.join(', ');

  // LINEのメッセージをChatGPTに投げるメッセージにセットする
  var messages = [
    {"role": "system", "content": "あなたは高級料理店の専門シェフです。 ユーザから与えられた食材のリスト使用して1種類のレシピを教えてくれます。レシピには、 ・キャッチーなタイトル、・調理するのに必要な時間、・与えられた食材、・追加で必要な食材、・レシピを含めてください。"

    } ,
    {"role": "user", "content": `食材リストは、${str_food} です`}
    ]

  const headers = {
    'Authorization': 'Bearer ' + GPT_API_KEY,
    'Content-Type': 'application/json',
  };
  // リクエストオプション
  const options = {
    'method': 'POST',
    'headers': headers,
    'payload': JSON.stringify({
      'model': MODEL_NAME,        // 使用するGPTモデル
      'max_tokens': MAX_TOKENS,   // レスポンストークンの最大値(最大4,096)
      'temperature': MODEL_TEMP,  // 応答の多様性(0-1)※数値が大きいほどランダムな応答になる
      'messages': messages
    })
  };
  try{
    // HTTPリクエストでChatGPTのAPIを呼び出す
    const res = JSON.parse(UrlFetchApp.fetch(GPT_ENDPOINT, options).getContentText());
    const replyText= res.choices[0].message.content.trimStart()
    

    // ChatGPTから返却されたメッセージ
    return replyText
  }catch(e){
    console.log(e)
  };
}



function requestDALLEImage(replyText) {
  //画像生成AIに投げるテキスト(プロンプト)を定義
  var prompt = replyText
  //OpenAIのAPIリクエストに必要なヘッダー情報を設定
  let headers = {
    'Authorization':'Bearer '+ GPT_API_KEY,
    'Content-Type': 'application/json'
  };
  //画像生成の枚数とサイズ、プロンプトをオプションに設定
  let options = {
    'muteHttpExceptions' : true,
    'headers': headers, 
    'method': 'POST',
    'payload': JSON.stringify({
      'n': 1,
      'size' : '256x256',
      'prompt': prompt})
  };
  //OpenAIの画像生成(Images)にAPIリクエストを送り、結果を変数に格納
  try{
      const response = JSON.parse(UrlFetchApp.fetch(DALLE_ENDPOINT, options).getContentText());

    
    return response.data[0].url
  }catch(e){
    console.log(e)
  }
}



// LINEへの応答
function lineReply(replyToken, replyText, urlDALLEImage) {
  // メッセージ返信のエンドポイント
  const url = 'https://api.line.me/v2/bot/message/reply';


  // 応答用のメッセージを作成
  const message = {
    "replyToken": replyToken,
    "messages": [{
      "type": "text",         // メッセージのタイプ(画像、テキストなど)
      "text": replyText
    },
    {
      "type": "image",         // メッセージのタイプ(画像、テキストなど)
      "originalContentUrl": urlDALLEImage,
      "previewImageUrl": urlDALLEImage
    }
    ] // メッセージの内容
  };
  // LINE側へデータを返す際に必要となる情報
  options = {
    "method": "post",
    "headers": {
      "Content-Type": "application/json; charset=UTF-8",  // JSON形式を指定、LINEの文字コードはUTF-8
      "Authorization": "Bearer " + LINE_TOKEN           // 認証タイプはBearer(トークン利用)、アクセストークン
    },
    "payload": JSON.stringify(message)                    // 応答文のメッセージをJSON形式に変換する
  };
  // LINEへ応答メッセージを返す
  try{
    UrlFetchApp.fetch(url, options);
  }catch(e){
    console.log(e)
  }
}
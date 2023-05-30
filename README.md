# LINEbot_recipeGPTbyPhoto
## 機能
- 食材の写真をLINEに送ると、それらの食材を使った料理のレシピを提案してくれます。
- 加えて、レシピ内容から予想される料理の完成画像を生成します。


## 動作例
### 例1
入力→出力
<div style="display:flex;">
    <img src="https://github.com/sgmtg/LINEbot_recipeGPTbyPhoto/assets/72187839/6faa17eb-4459-4d91-a43e-7fd1d5c2e93d" width="280"/>
    <img src="https://github.com/sgmtg/LINEbot_recipeGPTbyPhoto/assets/72187839/123dacff-fc6b-47a5-8320-ed8d84286036" width="280"/>
</div>

### 例2
入力→出力
<div style="display:flex;">
    <img src="https://github.com/sgmtg/LINEbot_recipeGPTbyPhoto/assets/72187839/96dfe6d3-7a60-41b0-be8e-3d984b14eb1a" width="280"/>
    <img src="https://github.com/sgmtg/LINEbot_recipeGPTbyPhoto/assets/72187839/9bf0ed0f-556d-448e-b9f5-09f6bb6bcf72" width="280"/>
</div>

## 使用方法
1. LINE Developersに登録しMessageAPIの設定を行う
2. GASのプロパティに LINE botのチャンネルアクセストークン、OpenAIのAPI Key、Cloud Vision API keyを設定する

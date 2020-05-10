$(function(){
  //ここで変数の宣言だけしておくとしたで変数をいろんな場所でしても一眼で管理できる
  let ctx,
      myPaddle,
      myBall,//ボールを管理する為の変数
      mouseX,//マウスの座標を管理するための変数
      score,//スコア表示についての変数その１
      scoreLabel,//スコア表示についての変数その２
      isPlaying = false,//ゲームをしているかどうかの判定を設定
      timerId;



  let canvas = document.querySelector('#mycanvas');
  if(!canvas || !canvas.getContext) return false;

  ctx = canvas.getContext('2d');

  let Label = function(x,y){//x,y座標を与えるとラベルを描画する様にする
      this.x = x;
      this.y = y;
      this.draw = function(text) {
           ctx.font = 'bold 14px "Century Gothic"';//文字のフォント指定
           ctx.fillStyle = '#00AAFF';//scoreの文字の色
           ctx.textAlign = 'left';//文字の位置を指定
           ctx.fillText(text, this.x, this.y);//テキストと記述
      }
  }

  //ボールのオブジェクト
  let Ball =function(x, y, vx, vy, r) {//x、y座標、速度（vx, vy)、半径（r)
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.r = r;
    this.draw = function(){
      ctx.beginPath();//描画する為のリセットをする記述（これがないと過去の記述がリセットされず残る（残像が描画される）
      ctx.fillStyle ='#FF0088';
      ctx.arc(this.x, this.y, this.r , 0, 2*Math.PI, true);//円を書く記述
            //円の記述は（引数：円の中心の x, y 座標と半径、そして始点の角度と終点の角度をラジアンで指定いる）
            // 円の描画は0 度から 360 度で指定する必要がある： 360 度は 「2 * Math.PI」で実行可能
            //円の開始地点のx座標、y座標、rの半径で0からMathの２ぱいとする。、trueとfalseは円の向き（時計方向or半時計方向）
            //Math.PIは円周率のこと（3.14,,,)
      ctx.fill();//塗り潰しの記述
      ctx.stroke();//枠線の記述


    };

    //ボールの動きの記述
     this.move = function(){
      this.x += this.vx;//この数値で玉を横に移動させる
      this.y += this.vy;//この数値で玉をy方向に移動させる

      //左端 or 右端にボールが当たった時の記述
      if (this.x + this.r > canvas.width || this.x - this.r < 0){//canvas.width）より大きい（右端にあたる）こと。
                                                                 //<0は0より小さくなる（左端にあたる）こと。
          this.vx *= -1;//(-1を掛けることでボールの向きを横に反転させる)
      }
      //ボールが上端に当たった時の記述
      if(this.y - this.r < 0) {//０より小さくというのはcanvasの上端を超えたらの意味（0は一番上だから）
         this.vy *= -1;//(-1を掛けることでボールの向きを縦に反転させる)
      }

      //ボールが下端に当たった時の記述
      if(this.y + this.r > canvas.height){//ボールがcanvasのheightを超えたらの意味
        // alert('game over');
        isPlaying = false;//game over時にfalseとすることで、setTimeoutのクリアをする様にしている
        $('#btn').text('REPLAY ?').fadeIn();//ボールが下端についたらリプレイボタンを表示
      }
    };


    //ボールがパドルに当たった時の跳ね返り判定を記述
    this.checkCollision = function(paddle) {
      if((this.y + this.r > paddle.y && 
        //↑ボールのy座標ボールの半径がパドルのy軸（今回は250）より大きく（ボールが下に行く）なった時かつ（ボールの下端がパドルに入った時）
          this.y + this.r < paddle.y + paddle.h) &&
        //↑ボールの下端に入ったときにちょっと幅を持たせる為の記述
        //ボールの下端がパドルのyだけでなく、パドルの高さを足し合わせたものの範囲に入ってきた時つまり→（10)+パドルのy軸(250)
          (this.x > paddle.x - paddle.w / 2 && 
        //↑パドルのx座標とボールのx座標を比べる。paddle.xはパドルの真ん中にある為、-paddle.w/2で調整をかけている。
        //ここでパドルの左端〜
          this.x < paddle.x + paddle.w /2)){
        //↑ボールのxがパドルの右端より小さかったら。
        //ここで〜パドルの右端となる
            this.vy *= -1//パドルに当たったらボールを反転させ、上に跳ね返す記述
            score++;//パドルに当たった時スコアを１増やす記述
            if(score %3 === 0){//scoreが３点入ったら（3の商の値が0の時）
              this.vx *= 1.2;//ボールのスピードを1.２倍にする
              paddle.w *= 0.9;//パドルの幅を0.9倍にする
            }
          }
      
    }
    
  }


  //パドルのオブジェクト
  let Paddle = function(w, h){//ここにパドルの記述をかく、引数に幅と高さを設定するといろいろな性質が設定される
   //パドルを作るには幅と高さだけでなく,x座標とy座標が必要
    this.w = w;//パドル幅
    this.h = h;//パドル高さ
    this.x = canvas.width /2;//パドルのx座標を設定canvas.widthで現在280に対して/2をしている（つまり140）
    this.y = canvas.height -30;//パドルのy座標を設定canvas.heightで現在280に対して-30をしている(つまり250)
    this.draw = function(){
          ctx.fillStyle = '#00AAFF';
          ctx.fillRect(this.x-this.w /2, this.y, this.w, this.h);//ここの幅設定で「-this.w/2」をすることで
                                                                 //パドルの横の中心がcanvasの中心と同じになる。（理屈はわかっていない）
   };

      this.move = function(){//ここの関数でパドル移動について記述
      this.x = mouseX - $('#mycanvas').offset().left;//マウスのxが通常では画面左上スタートなので、canvas範囲外の
                                                     //margin-left分のx座標をマイナスしている
    };

  };

  function rand(min, max) {//ボールの出現位置をランダムにする為のminとmaxの間の整数値を作る関数を設定
     return Math.floor(Math.random()* (max - min + 1)) + min;
  }


   function init() {//ゲームの初期化処理をinitで定義

        //スコアの初期化（ここで０としないと最初表示されるスコアが「undifined」になる（scoreLabel.draw('SCORE: ' + score);としている為）
        score =0;
        isPlaying = true;//ゲームをしているかの判定を設定（画面ロード時はfalseをゲームスタートでtrueにしている）

        //パドルのクラス生成
          myPaddle = new Paddle(100, 10);//Paddleの後にnewをつけて作るとPaddleの性質を持ったオブジェクトが作られ、
                                        //myPaddleに入れてくれる ←どういう意味？？？
        //ボールのクラス生成
          // myBall = new Ball(100, 100, 5, 5, 6);//Ballの性質を持つオブジェクトをnewで作成。基本形の記述
          myBall = new Ball(rand(50, 250), rand(10, 80), rand(3, 8),rand(3, 8), 6);//Ballの性質を持つオブジェクトをnewで作成。ボールの出現位置をランダムに

          //ボールの出現の記述を（）内でしている。左から出現のx座標、y座標、x方向の速度、y方向の速度、ボールの半径

        //スコアラベルのクラス生成
          scoreLabel = new Label(10, 25);//ここの値が文字の開始位置になる
          scoreLabel.draw('SCORE: ' + score);//スコアラベルの描画処理を実行

   }


    function clearstage() {//パドルをカーソルと紐付け動かすときに、これがないと動かす前のパドルの描画が残ってしまう。
                              //そうするとパドルが下いっぱいに動かすと描画される。これを防ぐ為に動かす前のパドルを消す記述
            ctx.fillStyle = '#AAEDFF'//canvasのbackground-colorと同じ色にする(この色をcanvas全体に描画している)
            ctx.fillRect(0, 0, canvas.width, canvas.height);
    }//このclearstageは常にcanvas範囲の背景を描画している。下で関数を呼ぶ際、clearstageの下でmyPaddle.drawすることで
    //背景色の上にパドルの描画をし、パドルを表示させている。


    function update(){//パドルをマウスを動かすとついてくる様に動かすには、パドルを一度記述するだけでなく、
                     //描画と移動を繰り返す処理を記入する必要がある。updateでそれを記述する
            clearstage();//canvasの背景色の描画
            scoreLabel.draw('SCORE: ' + score);//スコアの記述
            myPaddle.draw();//パドルの描画
            myPaddle.move();//パドルの移動の記述
            myBall.draw();
            myBall.move();
            myBall.checkCollision(myPaddle);//ボールがパドルに当たった時のアクションに使う
            timerId = setTimeout//ここでtimerIdを設定することでゲームを終了した時にボールの動きが早くなる（setTimeOutの繰り返しを止める）
            (function(){//コールバック関数による無限繰り返し処理を実行
                                  //update()の中でupdateをsettimeoutで呼ぶことで繰り返し処理をし、パドルが動く
              update();           //settimeout数値を大きくすると動きが鈍くなる。
            },30);
            if(!isPlaying)clearTimeout(timerId);//clearTimeout（既存設定）でsetTimeoutをクリアしている
                                                //falseの設定はgame overの記述に被せる
    };
            $('#btn').click(function() {//ボタンを押すと以下の関数を呼び出す
              $(this).fadeOut();//startを押すとボタンが消える
              init();//ゲームの初期化を実行
              update();//ゲームをスタートさせる
          });
    
    $('body').mousemove(function(e) {//console.logでeを見るとpageXという座標でポインターの位置情報を取得していると
      //わかる。これによってマウスのx座標を取得し、マウスの動きをパドルの動きと紐づけていく
          mouseX = e.pageX;    
          console.log(mouseX);
    });





});

let btn2 = document.querySelector('#btn2');



//コールバック関数
//ボタンを押すと「押したよ」が無限に発生する
btn2.onclick = 
function btnAlert(){
  alert('押したよ');
  setTimeout(btnAlert,2000);
};
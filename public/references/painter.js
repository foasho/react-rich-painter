const window_width = document.body.clientWidth;
if (window_width < 992){
    const ca = document.getElementById('canvas-area');
    ca.style.top = "10px";
}
//スマホかどうか
let isPhone = false;
if (window.matchMedia && window.matchMedia('(max-device-width: 640px)').matches){
  isPhone = true;
}
//配信型のルームかどうか
let isRoomForPainter = false;
if ($("#room_data").data("room_id") !== undefined &&
      $("#room_data").data("is_group_room") == 'True'){
  isRoomForPainter = true;
}
// Updateモードかどうか
let isUpdateWork = false;
let UpdateWorkId = "";
if (document.getElementById("update_work_id")!=undefined){
  isUpdateWork = true;
  UpdateWorkId = parseInt(document.getElementById("update_work_id").dataset.work_id);
}
function getSizeCanvasOpen(){
    const motif_data = document.getElementById('motif');
    if (motif_data){
      const dw = $('#default_layer').width();
      const dh = $('#default_layer').height();
      const wd = parseInt(motif_data.dataset.motif_width);
      const hd = parseInt(motif_data.dataset.motif_height);
      if (dw>dh){
        const hh = dh;
        const ww = dh * wd/hd;
        return [ww, hh];
      }
      else {
        const ww = dw;
        const hh = dw * dh/dw;
        return [ww, hh];
      }
    }
    else if (isRoomForPainter){//参加型配信の場合, キャンバス比率は, 1:1にする。
      const dw = $('#default_layer').width();
      const dh = $('#default_layer').height();
      if (dw>dh){
        const hh = dh;
        const ww = dh;
        return [ww, hh];
      }
      else {
        const ww = dw;
        const hh = dw;
        return [ww, hh];
      }
    }
    else if (isUpdateWork){
      const update_work_data = document.getElementById('update_work_id');
      const dw = $('#default_layer').width();
      const dh = $('#default_layer').height();
      console.log(update_work_data.dataset.update_work_width);
      console.log(update_work_data.dataset.update_work_height);
      const wd = parseInt(update_work_data.dataset.update_work_width);
      const hd = parseInt(update_work_data.dataset.update_work_height);

      if (dw>dh){
        const hh = dh;
        const ww = dh * wd/hd;
        return [ww, hh];
      }
      else {
        const ww = dw;
        const hh = dw * dh/dw;
        return [ww, hh];
      }
    }
    else {
      const wd = $('#default_layer').width();
      const hd = $('#default_layer').height();
      return [wd, hd];
    }
}
const [wd, hd] = getSizeCanvasOpen();
let _width = wd;
let _height = hd;
let selectLayer = 1;
let layer_num  = 2;
let select_pen_type = "pen";
let prev_pen_type;
let isFinger = false;
let isEraser = false;//true:eraser false:pen
let isDrawStatus = true;
let last_pos = {x:0, y:0, pressure:1};
let select_input_type = "pen";
let default_settings = {
    color: "#99DDFF",
    size: 10,
    opacity: 1.0,
    merge: 0.1,
    minimum: 0.01,
    flow: 0.20,
    distance: 0.01,
    stabilize_level: 5,
    stabilize_weight: 0.5,
};
let color_histories = [];
const max_history_length = 30;

let record_params = {
    isCheck: false,
    isPaint: false,
    recordStartTimes: Date.now(),
    startTime: Date.now(),
    undo_count: 0,//戻った回数
    stroke_times: [],//実作業時間
    paint_time: 0,//描いてる総時間
}

var croquis = new Croquis();
croquis.lockHistory();
croquis.setCanvasSize(_width, _height);
croquis.addLayer();
croquis.addLayer();//もう一枚追加する
croquis.selectLayer(layer_num);//レイヤー１を選択
croquis.unlockHistory();
//レイヤーの透明度を変更するとき: croquis.setLayerOpacity(opacity, index);
//キャンバスを回転させる場合：

var brush = new Croquis.Brush();
brush.setSize(default_settings.size);
brush.setColor(default_settings.color);//初期色
brush.setSpacing(default_settings.distance);

croquis.setTool(brush);
croquis.setToolStabilizeLevel(default_settings.stabilize_level);
croquis.setToolStabilizeWeight(default_settings.stabilize_weight);
croquis.setPaintingOpacity(default_settings.opacity);
brush.setFlow(default_settings.flow);

//利用者のデバイスチェック
let userDevice="";
if ((navigator.userAgent.indexOf('iPhone') > 0 || navigator.userAgent.indexOf( 'iPad') > 0)) {
    userDevice="ios";
} else if (navigator.userAgent.indexOf('Android') > 0) {
    userDevice="android";
} else {
    userDevice="pc";
}
brush.setUserDevice(userDevice);

//入力タイプのアラートのカウント
let alert_input_count = 3;
let alert_lock= false;

var croquisDOMElement = croquis.getDOMElement();
croquisDOMElement.id = "main_canvas_area";
var canvasArea = document.getElementById('canvas-area');
canvasArea.appendChild(croquisDOMElement);
function canvasPointerDown(e) {
    // 選択した入力タイプかどうかチェック
    if (select_input_type !== e.pointerType){
        alert_input_count--;
        if (alert_input_count <= 0 && !(alert_lock)){
            alert_lock = true;
            $.confirm({
              title: "確認",
              content: `現在の入力タイプが、『${select_input_type}』がなっています。\n『${e.pointerType}』に変更しますか？`,
              buttons: {
                ok: {
                  text: "確認",
                  btnClass: 'btn-blue',
                  action: function() {
                    document.getElementById("select_input").value = e.pointerType;
                    select_input_type = e.pointerType;
                  }
                },
                cancel: {
                  text: "キャンセル",
                  action: function() {
                    console.log("cancel");
                  }
                },
              }
            });
        }
      return false;
    }

    setRecordParams();//時間やクオリティの管理者

    setPointerEvent(e);
    var pointerPosition = getRelativePosition(e.clientX, e.clientY);
    //右クリックの場合、スポイトとして機能させる
    if (e.button == 2) {
        DripperColor(pointerPosition.x, pointerPosition.y);
        return false;
    }
    if (isDrawStatus){
        if (pointerEventsNone)
            canvasArea.style.setProperty('cursor', 'none');
        if (e.pointerType === "pen" && e.button == 5)
            croquis.setPaintingKnockout(true);
        croquis.down(pointerPosition.x, pointerPosition.y, e.pointerType === "pen" ? e.pressure : 1);
        document.addEventListener('pointermove', canvasPointerMove);
        document.addEventListener('pointerup', canvasPointerUp);
    }
    if (select_pen_type == "dropper"){
        DripperColor(pointerPosition.x, pointerPosition.y);
        //changeTool(prev_pen_type);
    }
    else if(select_pen_type == "area"){
        document.addEventListener('pointermove', canvasPointerMove);
        document.addEventListener('pointerup', canvasPointerUp);
        areaCanvasdown(last_pos.x, last_pos.y, pointerPosition.x, pointerPosition.y);
    }
}
function canvasPointerMove(e) {
    // 選択した入力タイプかどうかチェック
    if (e.pressure > 0){
        if(select_input_type !== e.pointerType){
            return false;
        }
    }

    setPointerEvent(e);
    var pointerPosition = getRelativePosition(e.clientX, e.clientY);
    if (isDrawStatus) {
        croquis.move(pointerPosition.x, pointerPosition.y, e.pointerType === "pen" ? e.pressure : 1);
    }
    else if (select_pen_type == "area"){
        if (last_pos.x > 0){
            areaCanvasMove(last_pos.x, last_pos.y, pointerPosition.x, pointerPosition.y);
        }
    }
    if (select_pen_type == "dropper"){
        if (e.pressure > 0) {
            DripperColor(pointerPosition.x, pointerPosition.y);
        }
    }
    //last_postの更新
    last_pos.x = pointerPosition.x;
    last_pos.y = pointerPosition.y;
    last_pos.pressure = e.pressure;
}
function canvasPointerUp(e) {
    if (select_input_type !== e.pointerType){
        last_pos.x = 0;
        last_pos.y = 0;
        last_pos.pressure = 0;
        record_params.isPaint = false;
        return false;
    }
    setPointerEvent(e);
    var pointerPosition = getRelativePosition(e.clientX, e.clientY);
    if (isDrawStatus) {
        if (pointerEventsNone)
            canvasArea.style.setProperty('cursor', 'crosshair');
        croquis.up(pointerPosition.x, pointerPosition.y, e.pointerType === "pen" ? e.pressure : 1);
        if (e.pointerType === "pen" && e.button == 5)
            setTimeout(function () {
                croquis.setPaintingKnockout(isEraser)
            }, 3000);

        //  カラーヒストリーに保存する
        const hex = brush.getColor();
        const color_history_element = document.createElement('a');
        color_history_element.className = "color_histories"
        color_history_element.style.background = hex;
        color_history_element.onclick = () => {
          picker.setColor(hex);
          easypicker.setColor(hex);
          colorView.style.background = hex;
          easycolorView.style.background = hex;
        };
        if (color_histories.length < max_history_length){
          if (color_histories.length > 0){
            if (color_histories[0] !== hex){
              document.getElementById('color_history_area').prepend(color_history_element);
              color_histories.unshift(hex);
            }
          }
          else if (color_histories.length === 0) {
            document.getElementById('color_history_area').prepend(color_history_element);
            color_histories.unshift(hex);
          }
        }
        else {
          if (color_histories[0] !== hex) {
            document.getElementsByClassName("color_histories")[max_history_length - 1].remove();
            document.getElementById('color_history_area').prepend(color_history_element);
            color_histories.shift();
            color_histories.unshift(hex);
          }
        }
        //ブラシ設定をLocalStorageに保存
        setLocalStorageBrushSettings(select_pen_type);
    }
    else if (select_pen_type == "area"){
        areaCanvasUp(pointerPosition.x, pointerPosition.y);
        document.removeEventListener('pointermove', canvasPointerMove);
        document.removeEventListener('pointerup', canvasPointerUp);
    }
    else if (select_pen_type == "dropper"){
        DripperColor(pointerPosition.x, pointerPosition.y);
        changeTool(prev_pen_type);
    }
    last_pos.x = 0;
    last_pos.y = 0;
    last_pos.pressure = 0;

    setRecordParams();
    record_params.isPaint = false;
}
function getRelativePosition(absoluteX, absoluteY) {
    var rect = croquisDOMElement.getBoundingClientRect();
    return {x: absoluteX - rect.left, y: absoluteY - rect.top};
}
croquisDOMElement.addEventListener('pointerdown', canvasPointerDown);//最初の発火
console.log(userDevice);
canvasArea.addEventListener('touchstart', (event)=>{
  event.preventDefault();
  if (userDevice==='ios' && select_input_type==='pen'){
    const touches = event.changedTouches;
    if ( touches.length === 2 ) {
      croquis.undo();
    }
  }
});

//計測時間やクオリティを管理する
function setRecordParams() {
    if(!record_params.isPaint){//描画時間を計測
        record_params.startTime = Date.now();
        record_params.isPaint = true;
        record_params.isCheck = true;
    }
    else {
        const endTime = Date.now();
        const time = (endTime - record_params.startTime);
        record_params.stroke_times.push(time);
        record_params.startTime = Date.now();
    }
}

//レイヤーをクリアにする
var clearButton = document.getElementById('clear-button');
clearButton.onclick = function () {
  $.confirm({
    title: "確認",
    content: "キャンバスをクリアにしますか？",
    buttons: {
      ok: {
        text: "確認",
        btnClass: 'btn-blue',
        action: function() {
          croquis.clearLayer();
        }
      },
      cancel: {
        text: "キャンセル",
        action: function() {
          console.log("cancel");
        }
      },
    }
  });
};
function outClearLayer() {
  croquis.clearLayer();
  croquis.fillLayer("#ffffff");
}
//レイヤー塗りつぶし
var fillButton = document.getElementById('fill-button');
fillButton.onclick = function () {
    $.confirm({
      title: "確認",
      content: "キャンバスの塗りつぶしを行いますか？",
      buttons: {
        ok: {
          text: "確認",
          btnClass: 'btn-blue',
          action: function() {
            const hex = brush.getColor();
            const a = (croquis.getPaintingOpacity() * 255).toString(16);
            const hex_rgba = hex + a;
            croquis.fillLayer(hex_rgba);
          }
        },
        cancel: {
          text: "キャンセル",
          action: function() {
            console.log("cancel");
          }
        },
      }
    });
}
//Img要素をBase64画像に変換
function ImageToBase64(img, mime_type) {
    // New Canvas
    let mcanvas = document.createElement('canvas');
    mcanvas.width  = img.width;
    mcanvas.height = img.height;
    // Draw Image
    let mctx = canvas.getContext('2d');
    mctx.drawImage(img, 0, 0);
    // To Base64
    return mcanvas.toDataURL(mime_type);
}
//レイヤーにテクスチャを描画する。
function putTexture() {
    const motif_data = document.getElementById('motif');
    const _course_data = document.getElementById('course_data');
    const practice_type = document.getElementById("practice_type").value;
    if (motif_data){//線画を描画する
      let putImageElement;
      let snum = 0;
      if (practice_type == 'color') {
        putImageElement = document.getElementById("motif_edge_image");
      }
      else if (practice_type == 'trace'){
        putImageElement = document.getElementById("motif_trace_image");
        snum = 1;
      }
      if (putImageElement){
        const mimage = putImageElement.cloneNode(true);
        mimage.onload = function () {
          croquis.getLayerContext(selectLayer-snum).drawImage(mimage, 0, 0
            , mimage.width, mimage.height, 0, 0, _height*mimage.width/mimage.height, _height);
        }
      }
    }
    else if (_course_data){
      let putImageElement;
      let snum = 0;
      if (practice_type == 'color') {
        putImageElement = document.getElementsByClassName("course-image")[0];
      }
      else if (practice_type == 'trace'){
        snum = 1;
        putImageElement = document.getElementsByClassName("course-image")[0];
      }
      if (putImageElement) {
        const mimage = putImageElement.cloneNode(true);
        mimage.onload = function () {
          croquis.getLayerContext(selectLayer - snum).drawImage(mimage, 0, 0
            , mimage.width, mimage.height, 0, 0, _height * mimage.width / mimage.height, _height);
        }
      }
    }
    else if (isUpdateWork){
      let putImageElement = document.getElementById("update_work_image");
      let snum = 0;
      if (putImageElement) {
        const mimage = putImageElement.cloneNode(true);
        console.log("画像を置きます。");
        mimage.onload = function () {
          croquis.getLayerContext(selectLayer - snum).drawImage(mimage, 0, 0
            , mimage.width, mimage.height, 0, 0, _height * mimage.width / mimage.height, _height);
        }
      }
    }
    else {
      //参加型ルームの場合は、描画しない。
      if (isRoomForPainter){
        return;
      }
      base_image = new Image();
      base_image.src = '/static/paint/img/tex.png';
      base_image.crossOrigin = "Anonymous";
      base_image.onload = function(){
        croquis.getLayerContext(selectLayer-1).drawImage(base_image, 0, 0);
      }
    }
}
function putImagetoBaseCanvas(imgEle) {
  const mimage = imgEle.cloneNode(true);
  mimage.onload = function () {
    croquis.getLayerContext(0).drawImage(mimage, 0, 0
      , mimage.width, mimage.height, 0, 0, _height*mimage.width/mimage.height, _height);
  }
}
putTexture();

//ブラシテクスチャ
var circleBrush = document.getElementById('circle-brush');
var brushImages = document.getElementsByClassName('brush-image');
var currentBrush = circleBrush;

Array.prototype.map.call(brushImages, function (brush) {
    brush.addEventListener('pointerdown', brushImagePointerDown);
});
//現在のブラシの形状を描画する
function brushImagePointerDown(e) {
    var image = e.currentTarget;
    currentBrush.className = 'brush-image';
    image.className = 'brush-image on';
    currentBrush = image;
    if (image == circleBrush)
        image = null;
    brush.setImage(image);
    updatePointer();
}
var pointerEventsNone = document.documentElement.style.pointerEvents !== undefined;
var brushPointerContainer = document.createElement('div');
brushPointerContainer.className = 'brush-pointer';

if (pointerEventsNone) {
    croquisDOMElement.addEventListener('pointerover', function () {
        croquisDOMElement.addEventListener('pointermove', croquisPointerMove);
        document.body.appendChild(brushPointerContainer);
    });
    croquisDOMElement.addEventListener('pointerout', function () {
        croquisDOMElement.removeEventListener('pointermove', croquisPointerMove);
        try{
            brushPointerContainer.parentElement.removeChild(brushPointerContainer);
        }
        catch (e) {
            console.log("catch paint");
        }
    });
}
//ポインタが動いたときに、ブラシポインタも移動する。
function croquisPointerMove(e) {
    if (pointerEventsNone) {
        var x = e.clientX + window.pageXOffset;
        var y = e.clientY + window.pageYOffset;
        brushPointerContainer.style.setProperty('left', x + 'px');
        brushPointerContainer.style.setProperty('top', y + 'px');
    }
}
//仮想ポインタ作成
let virtual_canvas = document.createElement("canvas");
virtual_canvas.ctx = virtual_canvas.getContext("2d");
function updatePointer() {
    if (pointerEventsNone) {
        var image = currentBrush;//HTMLIMGElement
        var threshold;
        if (currentBrush == circleBrush) {
            image = null;
            threshold = 0xff;
        }
        else {
            threshold = 0x30;
        }
        var brushPointer = Croquis.createBrushPointer(image, virtual_canvas, brush.getSize(), brush.getAngle(), threshold, true);
        //var brushPointer = Croquis.createBrushPointer(image, brush.getSize(), threshold, true);
        brushPointer.style.setProperty('margin-left',
            '-' + (brushPointer.width * 0.5) + 'px');
        brushPointer.style.setProperty('margin-top',
            '-' + (brushPointer.height * 0.5) + 'px');
        brushPointerContainer.innerHTML = '';
        brushPointerContainer.appendChild(brushPointer);
    }
}
updatePointer();

//EasyDetailViewerの設定
open_easy_detail = document.getElementById("open_easy_detail");
easy_detail_viewer = document.getElementById("easy_detail_viewer");

$("#easy_detail_viewer").easyDrag({"handle": $("#easy_detail_viewer_title")});
open_easy_detail.onclick = () => {
  if (easy_detail_viewer.style.display=="block"){
    easy_detail_viewer.style.display="none";
  }
  else {
    easy_detail_viewer.style.display="block";
  }
}


//安定度の設定
var selectInputType =
    document.getElementById('select_input');
var toolStabilizeLevelSlider =
    document.getElementById('tool-stabilize-level-slider');
var toolStabilizeWeightSlider =
    document.getElementById('tool-stabilize-weight-slider');
selectInputType.addEventListener('input', (e) => {select_input_type = e.target.value;})
toolStabilizeLevelSlider.value = croquis.getToolStabilizeLevel();
toolStabilizeWeightSlider.value = croquis.getToolStabilizeWeight();

//ブラシの設定
var brushSizeSlider = document.getElementById('brush-size-slider');
var brushOpacitySlider = document.getElementById('brush-opacity-slider');
var brushFlowSlider = document.getElementById('brush-flow-slider');
var brushMinimumSizeSlider = document.getElementById('brush-minimum-size-slider');
var brushMergeSlider = document.getElementById('brush-merge-slider');
var brushSpacingSlider = document.getElementById('brush-spacing-slider');
var brushAngleSlider = document.getElementById('brush-angle-slider');
var brushRotateToDirectionCheckbox = document.getElementById('brush-rotate-to-direction-checkbox');
//簡易設定
var easyBrushSizeSlider = document.getElementById('easy-brush-size-slider');
var easyBrushOpacitySlider = document.getElementById('easy-brush-opacity-slider');
var easyBrushFlowSlider = document.getElementById('easy-brush-flow-slider');
var easyBrushMinimumSizeSlider = document.getElementById('easy-brush-minimum-size-slider');
var easyBrushMergeSlider = document.getElementById('easy-brush-merge-slider');
var easyBrushSpacingSlider = document.getElementById('easy-brush-spacing-slider');
var colorView = document.getElementById('color_view');
var easycolorView = document.getElementById('easy_color_view');

brushSizeSlider.value = brush.getSize();
brushOpacitySlider.value = croquis.getPaintingOpacity();
brushMinimumSizeSlider.value = brush.getMinimumSize();
brushMergeSlider.value = brush.getMerge();
brushFlowSlider.value = brush.getFlow();
brushSpacingSlider.value = brush.getSpacing();
brushAngleSlider.value = brush.getAngle();//未使用(ブラシの回転)
//brushRotateToDirectionCheckbox.checked = brush.getRotateToDirection();//未使用ブラシの回転方向
//簡易設定
easyBrushSizeSlider.value = brush.getSize();
easyBrushOpacitySlider.value = croquis.getPaintingOpacity();
easyBrushMinimumSizeSlider.value = brush.getMinimumSize();
easyBrushMergeSlider.value = brush.getMerge();
easyBrushFlowSlider.value = brush.getFlow();
easyBrushSpacingSlider.value = brush.getSpacing();

toolStabilizeLevelSlider.oninput = function () {
    croquis.setToolStabilizeLevel(toolStabilizeLevelSlider.value);
    toolStabilizeLevelSlider.value = croquis.getToolStabilizeLevel();
};
toolStabilizeWeightSlider.onchange = function () {
    croquis.setToolStabilizeWeight(toolStabilizeWeightSlider.value);
    toolStabilizeWeightSlider.value = croquis.getToolStabilizeWeight();
};
//消しゴム・もしくは指ブラシに変更
function changeEraserFinger() {
    croquis.setPaintingKnockout(isEraser);
    brush.setIsFinger(isFinger);
};
//クリッピングレイヤーに変更する
function changeClipping() {
    //croquis.s;
}
brushSizeSlider.oninput = function () {
    brush.setSize(brushSizeSlider.value);
    updatePointer();
    document.getElementById("size_per").innerText = brushSizeSlider.value;
};
brushOpacitySlider.oninput = function () {
    croquis.setPaintingOpacity(brushOpacitySlider.value);
    document.getElementById("alpha_per").innerText = Math.floor(brushOpacitySlider.value * 100);
};
brushMinimumSizeSlider.oninput = function () {
    brush.setMinimumSize(brushMinimumSizeSlider.value);
    document.getElementById("minimum_size_per").innerText = Math.floor(brushMinimumSizeSlider.value * 100);
};
brushMergeSlider.oninput = function () {
    brush.setMerge(brushMergeSlider.value);
    document.getElementById("merge_per").innerText = Math.floor(brushMergeSlider.value * 100);
};
brushFlowSlider.oninput = function () {
    brush.setFlow(brushFlowSlider.value);
    document.getElementById("flow_per").innerText = Math.floor(brushFlowSlider.value * 100);
};
brushSpacingSlider.oninput = function () {
    brush.setSpacing(brushSpacingSlider.value);
    document.getElementById("spacing_per").innerText = Math.floor(brushSpacingSlider.value * 100);
};
//追加
brushAngleSlider.oninput = function () {
    brush.setAngle(brushAngleSlider.value);
    document.getElementById("angle_per").innerText = brushAngleSlider.value;
    updatePointer();
};
//未使用
// brushRotateToDirectionCheckbox.onchange = function () {
//     brush.setRotateToDirection(brushRotateToDirectionCheckbox.checked);
// }
//簡易ペイント
easyBrushSizeSlider.oninput = function () {
    brush.setSize(easyBrushSizeSlider.value);
    updatePointer();
    brushSizeSlider.value = easyBrushSizeSlider.value;
};
easyBrushOpacitySlider.oninput = function () {
    croquis.setPaintingOpacity(easyBrushOpacitySlider.value);
    brushOpacitySlider.value = easyBrushOpacitySlider.value;
};
easyBrushMinimumSizeSlider.oninput = function () {
    brush.setMinimumSize(easyBrushMinimumSizeSlider.value);
    brushMinimumSizeSlider.value = easyBrushMinimumSizeSlider.value;
};
easyBrushMergeSlider.oninput = function () {
    brush.setMerge(easyBrushMergeSlider.value);
    brushMergeSlider.value = easyBrushMergeSlider.value;
};
easyBrushFlowSlider.oninput = function () {
    brush.setFlow(easyBrushFlowSlider.value);
    brushFlowSlider.value = easyBrushFlowSlider.value;
};
easyBrushSpacingSlider.oninput = function () {
    brush.setSpacing(easyBrushSpacingSlider.value);
    brushSpacingSlider.value = easyBrushSpacingSlider.value;
};

// OSがMAｃがどうかチェックする
var mac = navigator.platform.indexOf('Mac') >= 0;
//キーボード入力・ショートカットキー
document.addEventListener('keydown', documentKeyDown);
function documentKeyDown(e) {
    if (mac ? e.metaKey : e.ctrlKey) {
        switch (e.keyCode) {
        case 89: //ctrl + y
            croquis.redo();
            break;
        case 90: //ctrl + z
            record_params.undo_count++;
            croquis[e.shiftKey ? 'redo' : 'undo']();
            break;
        }
    }
}
//pointerのイベント
function setPointerEvent(e) {
    if (e.pointerType !== "pen" && Croquis.Tablet.pen() && Croquis.Tablet.pen().pointerType) {//it says it's not a pen but it might be a wacom pen
        e.pointerType = "pen";
        e.pressure = Croquis.Tablet.pressure();
        if (Croquis.Tablet.isEraser()) {
            Object.defineProperties(e, {
                "button": { value: 5 },
                "buttons": { value: 32 }
            });
        }
    }
}
//現在のブラシの設定値を取得する。
function getNowBrushSettings(){
  const params = {
    color: brush.getColor().toString(),
    size: brushSizeSlider.value,
    opacity: brushOpacitySlider.value,
    merge: brushMergeSlider.value,
    minimum: brushMinimumSizeSlider.value,
    flow: brushFlowSlider.value,
    distance: brushSpacingSlider.value,
    stabilize_level: toolStabilizeLevelSlider.value,
    stabilize_weight: toolStabilizeWeightSlider.value,
  };
  return params;
}
//ブラシの設定値をLocalStorageにセットする。
function setLocalStorageBrushSettings(brush_type) {
  const params = getNowBrushSettings();
  localStorage.removeItem(brush_type);
  localStorage.setItem(brush_type, JSON.stringify(params));
}
//localStorageから設定を取得する
function getLocalStorageBrushSettings(brush_type) {
  if (localStorage.getItem(brush_type)){
    const params = JSON.parse(localStorage.getItem(brush_type))
    return params;
  }
  return default_settings;
}
//すべてのブラシ設定を削除する
function removeAllBrushSettings() {
  swal('ブラシ設定を初期化しますか？', "システムの不具合等が治る場合がございます。", "warning"
    , {buttons: ['キャンセル', '初期化']}).then((value) => {
      if (value){
        const brush_tools = document.getElementsByClassName("brush-tool");
        for (let i = 0; i < brush_tools.length; i++) {
            const brush_tool = brush_tools[i];
            brush_tool.addEventListener("click", (e) => {
                const brush_tool_id = e.target.id;
                localStorage.removeItem(brush_tool_id);
            });
        }
        settingPainterData(select_pen_type);
        swal('初期化完了', "ブラシ設定の初期化が完了しました。", "success")
      }
  });
}
document.getElementById("default_back_btn").onclick = () => {removeAllBrushSettings()}
document.getElementById("easy_default_back_btn").onclick = () => {removeAllBrushSettings()}
//ブラシの設定をする
function settingPainterData(brush_type) {
  const params = getLocalStorageBrushSettings(brush_type);
  //color
  picker.setColor(params.color);
  easypicker.setColor(params.color);
  colorView.style.background = params.color;
  easycolorView.style.background = params.color;
  //size
  brush.setSize(params.size);
  brushSizeSlider.value = params.size;
  easyBrushSizeSlider.value = params.size;//easy
  document.getElementById("size_per").innerText = params.size;
  updatePointer();
  //opacity
  croquis.setPaintingOpacity(params.opacity);
  brushOpacitySlider.value = params.opacity;
  easyBrushOpacitySlider.value = params.opacity;//easy
  document.getElementById("alpha_per").innerText = Math.floor(params.opacity * 100);
  //merge
  brush.setMerge(params.merge);
  brushMergeSlider.value = params.merge;
  easyBrushMergeSlider.value = params.merge;
  document.getElementById("merge_per").innerText = Math.floor(params.merge * 100);
  //minimum
  brush.setMinimumSize(params.minimum);
  brushMinimumSizeSlider.value = params.minimum;
  easyBrushMinimumSizeSlider.value = params.minimum;
  document.getElementById("minimum_size_per").innerText = Math.floor(params.minimum * 100);
  //flow
  brush.setFlow(params.flow);
  brushFlowSlider.value = params.flow;
  easyBrushFlowSlider.value = params.flow;
  document.getElementById("flow_per").innerText = Math.floor(params.flow * 100);
  //spacing
  brush.setSpacing(params.distance);
  brushSpacingSlider.value = params.distance;
  easyBrushSpacingSlider.value = params.distance;
  document.getElementById("spacing_per").innerText = Math.floor(params.distance * 100);
  //stable-level
  toolStabilizeLevelSlider.value = params.stabilize_level;
  croquis.getToolStabilizeLevel(params.stabilize_level);
  //stable-weight
  toolStabilizeWeightSlider.value = params.stabilize_weight;
  croquis.getToolStabilizeWeight(params.stabilize_weight);
}
settingPainterData(select_pen_type);//初回起動

//HEX値をRGBに変換する
function hex2rgb(hex) {
    if (hex.slice(0, 1) == "#") hex = hex.slice(1);
    if (hex.length == 3) hex = hex.slice(0, 1) + hex.slice(0, 1) + hex.slice(1, 2) + hex.slice(1, 2) + hex.slice(2, 3) + hex.slice(2, 3);

    return [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map(function (str) {
        return parseInt(str, 16);
    });
}
//RGB値をHEX値に変換する
function rgb2hex(rgb) {
    return "#" + rgb.match(/\d+/g).map(function (a) {
        return ("0" + parseInt(a).toString(16)).slice(-2)
    }).join("");
}
//現在レイヤーの



//追加モジュール
/** 新規ブラシの追加 **/
const brush_input_btn = document.getElementById("brush_input_btn");
document.getElementById("add_brush_image").onclick = () => {
    brush_input_btn.click();
};
brush_input_btn.onchange = (event) => {
    let file = event.target.files[0];
    let blobUrl = window.URL.createObjectURL(file);
    let img = document.createElement("img");
    img.className = "brush-image";
    img.src = blobUrl;
    document.getElementById("brush_type_list").prepend(img);
    //更新
    brushImages = document.getElementsByClassName('brush-image');
    Array.prototype.map.call(brushImages, function (brush) {
        brush.addEventListener('pointerdown', brushImagePointerDown);
    });
};
/** -------------- **/

/** 自動着彩機能 **/
document.getElementById("auto_color_btn").onclick = () => {
    if (window.confirm("自動着彩を行いますか？")){
        pasteCanvastoRecordLayer();//状態を上書きする
        $('#loader-bg ,#loader').css('display','block');
        let formData = new FormData();
        const target_url = "paint/auto-color";
        let image_data = record_layer.toDataURL("image/png");
        image_data = image_data.replace(/^data:image\/png;base64,/, "");
        formData.append("paint_image", image_data);
        let record_request = new XMLHttpRequest();
        record_request.open("POST", target_url, true);
        const record_response = record_request.send(formData);
        record_request.onload = function (oEvent) {
            if (record_request.status == 200){
                const result_image = record_request.response;
                //alert(result_image);
                var autoColor_img = new Image();
                autoColor_img.src = result_image;
                autoColor_img.onload = function () {
                    //undoストックに保存する
                    croquis.pushDirtyRectUndo(0, 0, _width, _height, selectLayer);
                    let target_ctx = croquis.getLayerCanvas(selectLayer).getContext('2d');
                    target_ctx.drawImage(autoColor_img, 0, 0);
                }
            }
            $('#loader-bg ,#loader').css('display','none');
        };
    }
};
/** ----------- **/

/** サブビューの操作 **/
if (isPhone){
  $("#sub_viewer").easyDrag({"handle": $("#sub_viewer_title")});
}
else {
  $("#sub_viewer").easyDrag({"handle": $("#sub_viewer_title")});
}
document.getElementById('image_upload').addEventListener('change', function (e) {
    // 1枚だけ表示する
    let file = e.target.files[0];
    // ファイルのブラウザ上でのURLを取得する
    let blobUrl = window.URL.createObjectURL(file);
    // img要素に表示
    let img = document.getElementById('image_preview');
    img.src = blobUrl;
});
const sub_viewer = document.getElementById("sub_viewer");
const subviewer_btn = document.getElementById("subviewer_btn");
const close_subviewer = document.getElementById("close_subviewer");
subviewer_btn.addEventListener("click", closeSubviewer);
close_subviewer.addEventListener("click", closeSubviewer);
function closeSubviewer(event) {
    const sub_viewer_display = sub_viewer.style.display;
    if (sub_viewer_display != "block") {
        subviewer_btn.classList.add("action-selected");
        sub_viewer.style.display = "block";
    } else {
        subviewer_btn.classList.remove("action-selected");
        sub_viewer.style.display = "none";
    }
}
const expand_sub_viewer = document.getElementById("expand_sub_viewer");
expand_sub_viewer.addEventListener("click", ()=>{
    $("#sub_viewer").width("+=50");
    $("#sub_viewer").height("+=25");
});
const compress_sub_viewer = document.getElementById("compress_sub_viewer");
compress_sub_viewer.addEventListener("click", ()=>{
    $("#sub_viewer").width("-=50");
    $("#sub_viewer").height("-=25");
});
/** -- ------- -- **/

/** レイヤービューの操作 **/
const layer_viewer = document.getElementById("layer_viewer");
const easy_layer_select = document.getElementById("easy_layer_select");
//レイヤーの追加処理
const max_layer_num = 30;
function addNewLayer(){
    if (layer_num <= max_layer_num){
        croquis.addLayer(layer_num);
        //選択中を外す
        // const layer_selected = document.getElementsByClassName("layer-selected");
        // layer_selected[0].classList.remove("layer-selected");
        //viewerに追加する
        const layer_number_id = "select_layer_"+layer_num.toString();
        const layer_opacity_id = "layer_opacity_"+layer_num.toString();
        const layer_alpha_range_id = "layer_alpha_range"+layer_num.toString();
        //要素を作成する
        const layer_controll = document.createElement("div");
        // layer_controll.className = "layer-controll layer-selected";
        layer_controll.className = "layer-controll";
        layer_controll.id = layer_number_id;
        //handle
        const handle = document.createElement("div");
        handle.className = "handle";
        layer_controll.appendChild(handle);
        //view-item:name
        const view_item_name = document.createElement("div");
        view_item_name.className = "view-item name";
        const view_item_a = document.createElement("a");
        view_item_a.className = "view-item-a";
        view_item_a.innerText = "レイヤー"+layer_num.toString();
        view_item_a.href = "javascript:void(0)";
        view_item_name.appendChild(view_item_a);
        layer_controll.appendChild(view_item_name);
        //visualIconsも設定する
        const layer_visiable_icon = document.createElement("img");
        layer_visiable_icon.id = "visible_icon_" + layer_num.toString();
        layer_visiable_icon.src = "/static/paint/img/paint/eye.png";
        layer_visiable_icon.className = "view-item layer-visiable-icon on";
        layer_controll.appendChild(layer_visiable_icon);
        //view-item:text
        const view_item_text = document.createElement("div");
        view_item_text.className = "view-item";
        view_item_text.innerHTML = '<span id="_layer_opacity_id" class="layer-opacity-text">100</span>%</div>'.replace("_layer_opacity_id", layer_opacity_id);
        layer_controll.appendChild(view_item_text);
        //input
        const input_div = document.createElement("div");
        input_div.className = "input";
        const input = document.createElement("input");
        input.id = layer_alpha_range_id;
        input.className = "layer-alpha-range select-range";
        input.type = "range";
        input.max = "100";
        input.min = "0";
        input.value = "100";
        input_div.appendChild(input);
        layer_controll.appendChild(input_div);
        //Append
        const layer_viewer_content = document.getElementById("layer_viewer_content");
        layer_viewer_content.prepend(layer_controll);
        //EasyAppend-簡易レイヤーの追加
        const easy_layer_option = document.createElement("option");
        easy_layer_option.value = "layer_" + layer_num.toString();
        easy_layer_option.innerText = "レイヤー"+layer_num.toString();
        easy_layer_select.prepend(easy_layer_option);
    }
    else {
      console.error("最大レイヤー数(30)に達しています。")
    }
}
//表示非表示の切り替え
var changeLayerVisible = (event, layer_index) => {
    if (event.target.classList.contains("on")) {
        event.target.src = "/static/paint/img/paint/hidden.png";
        event.target.classList.remove("on");
        croquis.setLayerVisible(false, layer_index);
    } else {
        event.target.src = "/static/paint/img/paint/eye.png";
        event.target.classList.add("on");
        croquis.setLayerVisible(true, layer_index);
    }
}
function settingLayerVisiable() {
    $('.layer-visiable-icon').off("click");
    $('.layer-visiable-icon').click(function (event) {
        const length = croquis.getLayerCount()-1;
        const layer_index = length - $('.layer-visiable-icon').index(this);
        //console.log(layer_index);
        changeLayerVisible(event, layer_index);
    });
    //easy番
    $('#easy_visible_icon').off("click");
    $('#easy_visible_icon').click(function (event) {
        const length = croquis.getLayerCount()-1;
        const layer_index = length - $("#easy_layer_select").prop("selectedIndex");
        changeLayerVisible(event, layer_index);
    });
}
settingLayerVisiable();

//レイヤーの変更　レイヤー変更
function settingLayerControls() {
    const leng = croquis.getLayerCount() - 1;
    $('.view-item-a').off("click");
    $('.view-item-a').click(function (event) {
        const layer_index = $('.view-item-a').index(this);
        const layer_control = document.getElementsByClassName("layer-controll")[layer_index];
        const layer_selected = document.getElementsByClassName("layer-selected");
        if (isRoomForPainter && (leng-layer_index)==0){
          swal("選択不可", "配信者用のレイヤーのため、選択できません", "warning");
          return;
        }
        layer_selected[0].classList.remove("layer-selected");
        layer_control.classList.add("layer-selected");
        changeLayer(layer_index);
    });
    $('#easy_layer_select').off("click");
    $('#easy_layer_select').change(function (event) {
        const layer_index = $("#easy_layer_select").prop("selectedIndex");
        const layer_control = document.getElementsByClassName("layer-controll")[layer_index];
        const layer_selected = document.getElementsByClassName("layer-selected");
        if (isRoomForPainter && (leng-layer_index)==0){
          swal("選択不可", "配信者用のレイヤーのため、選択できません", "warning");
          return;
        }
        layer_selected[0].classList.remove("layer-selected");
        layer_control.classList.add("layer-selected");
        changeLayer(layer_index);
        //easyのプロパティ（opacity, visible）の反映
        const opacity = croquis.getLayerOpacity();//現在のレイヤー透明度
        const visible = croquis.getLayerVisible();//現在のvisiable:Bool
        document.getElementById("easy_layer_alpha_range").value = Math.round(opacity*100);
        if (visible){
          document.getElementById("easy_visible_icon").src = "/static/paint/img/paint/eye.png";
        }else{
          document.getElementById("easy_visible_icon").src = "/static/paint/img/paint/hidden.png";
        }
    })
}
function changeLayer(draw_layer_index){// 実際のレイヤーを変更
    const length = croquis.getLayerCount() - 1;
    selectLayer = length - draw_layer_index;
    croquis.selectLayer(length - draw_layer_index);
}
settingLayerControls();//初回起動
//外部からレイヤー情報を取得する際
function getNowLayerContext() {
  return croquis.getLayerCanvas(selectLayer).getContext('2d');
}

//レイヤーの透明度を変更する
function changeLayerAlpha(layer_index, opacity) {
    croquis.setLayerOpacity(opacity/100, layer_index);
    const layer_opacity_texts = document.getElementsByClassName("layer-opacity-text");
    const _opacity = Math.floor(opacity);
    const length = croquis.getLayerCount() - 1;
    layer_opacity_texts[length - layer_index].innerText = (_opacity).toString();
}
function settingLayerAlphaControl() {
    $('.layer-alpha-range').off('input');
    $('.layer-alpha-range').on("input", function (event) {
        const length = croquis.getLayerCount() - 1;
        const layer_index = length - $('.layer-alpha-range').index(this);
        changeLayerAlpha(layer_index, event.target.value);
    });
    //easy番
    $('#easy_layer_alpha_range').off('input');
    $('#easy_layer_alpha_range').on("input", function (event) {
        const length = croquis.getLayerCount() - 1;
        const layer_index = length - $('.easy-layer-select').prop("selectedIndex");
        changeLayerAlpha(layer_index, event.target.value);
    });
}
//初回起動
settingLayerAlphaControl();

//レイヤーの追加
const add_layer = document.getElementById("add_layer");
const easy_add_layer = document.getElementById("easy_add_layer")
add_layer.addEventListener("click", clickAddLayer);
easy_add_layer.addEventListener("click", clickAddLayer)
function clickAddLayer() {
  addNewLayer();
  settingLayerControls();
  settingLayerAlphaControl();
  settingLayerVisiable();
  //最後にレイヤーindexの調整を行う
  layer_num += 1;
  console.log("レイヤー追加");
}
//レイヤーの削除
const remove_layer = document.getElementById("remove_layer");
remove_layer.onclick = () => {
    //レイヤー数が２枚以上が条件
    if (layer_num >= 2){
        const select_layer = document.getElementsByClassName("layer-selected")[0];
        if (window.confirm("このレイヤーを削除してもいいですか？")){
            console.log("ここに削除処理を入れる");
        }
    }
};
//レイヤーの入れかえを可能にする
const layer_viewer_content = document.getElementById("layer_viewer_content");
if (!isRoomForPainter){//配信型ルーム以外の場合は、入れ替えできるようにする
  let sortable = Sortable.create(layer_viewer_content, {
    group: "layer",
    animation: 150,
    handle: ".handle",
    onMove: function (e) {
        //onEnd
      const layer_controlls = document.getElementsByClassName("layer-controll");
      const relate_index = layer_controlls.length - $(".layer-controll").index(e.related)-1;
      const drag_index = layer_controlls.length - $(".layer-controll").index(e.dragged)-1;
      if (relate_index !== drag_index){
        croquis.swapLayer(relate_index, drag_index);
      }
    },
    onEnd: function (e) {
      const layer_controlls = document.getElementsByClassName("layer-controll");
      let find_index;
      for(let i=0; i<layer_controlls.length; i++){
        const index = (layer_controlls.length-1) - i;
        const ls = layer_controlls[index];
        if( ls.classList.contains('layer-selected') == true ){
          find_index = $(".layer-controll").index(ls);
          break;
        }

      }
      if (find_index !== undefined){
        changeLayer(find_index);
      }
    },
});
}

/** -- ------- -- **/

/** 音楽の再生・停止 **/
// let isAudioPlay = false;
// const music_player = document.getElementById("music_player");
// music_player.volume = 0.5;
// music_player.repeat = true;
// const musicplay_btn = document.getElementById("musicplay_btn");
// const select_music = document.getElementById("select_music");
// musicplay_btn.addEventListener("click", () => {
//     if (isAudioPlay) {
//         musicplay_btn.src = "/static/paint/img/paint/sound_off.png";
//         music_player.pause();
//         isAudioPlay = false;
//     } else {
//         musicplay_btn.src = "/static/paint/img/paint/sound_on.png";
//         music_player.play();
//         isAudioPlay = true
//     }
// });
// document.getElementById("musicplay_btn").addEventListener("mouseenter", () => {
//     document.getElementsByClassName("music-area")[0].style.display = "block";
// });
/** -- ------- -- **/

/** ダウンロード 画像の保存 **/
const download_btn = document.getElementById("download_btn");
download_btn.addEventListener("click", () => {
    const filename = $("#ulid").data("ulid") + ".png";
    //透明度を変換して、保存する
    let link = document.createElement("a");
    link.href = record_layer.toDataURL("image/png");
    link.download = filename;
    link.click();
});
/** -- ------- -- **/


/** ブラシツールの変更 **/
const brush_tools = document.getElementsByClassName("brush-tool");
for (let i = 0; i < brush_tools.length; i++) {
    const brush_tool = brush_tools[i];
    brush_tool.addEventListener("click", (e) => {
        const brush_tool_id = e.target.id;
        changeTool(brush_tool_id);
    });
}
function changeTool(brush_tool_id) {
    if (select_pen_type === 'area' && isRectShow){
        rectCancel();
    }
    const brush_selected = document.getElementsByClassName("brush-selected");
    brush_selected[0].classList.remove("brush-selected");
    const brush_tool = document.getElementById(brush_tool_id);
    brush_tool.classList.add("brush-selected");
    //pen処理の切り替え
    if (brush_tool_id == "pen") {
        isDrawStatus = true;
        isEraser = false;
        isFinger = false;
        changeEraserFinger();
    }
    else if (brush_tool_id == "pencil") {
        isDrawStatus = true;
        isEraser = false;
        isFinger = false;
        changeEraserFinger();
    }
    else if(brush_tool_id == "eraser"){
        isDrawStatus = true;
        isEraser = true;
        isFinger = false;
        changeEraserFinger();
    }
    else if(brush_tool_id == "finger"){
        isDrawStatus = true;
        isEraser = false;
        isFinger = true;
        changeEraserFinger();
    }
    else {
        isDrawStatus = false;
    }
    if (brush_tool_id == "hold"){
        $("#canvas-area").easyDrag();
    }
    else {
        try{
            $("#canvas-area").easyDrag("kill");
        }catch (e) {
            console.log("ok still tool element");
        }
    }
    prev_pen_type = select_pen_type;
    select_pen_type = brush_tool_id;
    //console.log("ツールの変更："+select_pen_type);
    settingPainterData(brush_tool_id);//ブラシの設定を変更
}
/** ----------- **/

/** ----  簡易サイズの変更  ---- **/
const size_images = document.getElementsByClassName("size-image");
for (let i = 0; i < size_images.length; i++) {
    const size_image = size_images[i];
    size_image.addEventListener("click", (e) => {
        const size_id = e.target.id;
        const size = size_id.split("_")[1];
        setEasySize(parseInt(size));
    });
}
function setEasySize(size){
  brush.setSize(size);
  brushSizeSlider.value = size;
  document.getElementById("size_per").innerText = size;
  updatePointer();
}
/** -------------------------- **/

/** -- メインキャンパスでマウスホイールした際の処理 -- **/
let wheel_type = "brush_size";
document.getElementById("canvas-area").addEventListener("mousewheel", function (event) {
    if (wheel_type == "canvas_size") {
        if (event.deltaY < 0) {
            //scroll down
            console.log('キャンバス拡大');
        } else {
            //scroll up
            console.log('キャンバス縮小');
        }
    }
});
/** -------------------------------------------- **/

/** -- レコード用のRecordLayerを設定/ レコード保存処理 -- **/
let record_layer = document.getElementById("record_layer");
let record_ctx = record_layer.getContext("2d");
record_layer.width = _width;
record_layer.height = _height;
function pasteCanvastoRecordLayer() {
    record_ctx.clearRect(0, 0, _width, _height);
    record_ctx.fillStyle = "#ffffff";
    record_ctx.fillRect(0, 0, _width, _height);

    const copy_canvas = croquis.createFlattenThumbnail(_width, _height);
    record_ctx.drawImage(copy_canvas, 0, 0);
    //最後にナビゲーターにも適応させる
    drawNavigator();
}
//初回実行
window.onload = () => {pasteCanvastoRecordLayer();}
//一定間隔のに保存(250m[ms]) 100だと少し重い
setInterval(function () {
  if (true){
    pasteCanvastoRecordLayer();
  }
}, 250);
/** ------------------------------------- **/

/** -- ブラシのリセット処理 -- **/
const reset_btns = document.getElementsByClassName("reset");
for(let i=0; i<reset_btns.length; i++){
    const reset_btn = reset_btns[i];
    reset_btn.onclick = (event) => {
        const reset_type = event.target.id;
        switch (reset_type) {
            case "alpha_reset":
                croquis.setPaintingOpacity(default_settings.opacity);
                brushOpacitySlider.value = default_settings.opacity;
                document.getElementById("alpha_per").innerText = (default_settings.opacity*100).toString();
                break;
            case "flow_reset":
                brush.setFlow(default_settings.flow);
                brushFlowSlider.value = default_settings.flow;
                document.getElementById("flow_per").innerText = (default_settings.flow*100).toString();
                break;
            case "spacing_reset":
                brush.setSpacing(default_settings.distance);
                brushSpacingSlider.value = default_settings.distance;
                document.getElementById("spacing_per").innerText = (default_settings.distance*100).toString();
                break;
            case "merge_reset":
                brush.setMerge(default_settings.merge);
                brushSpacingSlider.value = default_settings.merge;
                document.getElementById("merge_per").innerText = (default_settings.merge*100).toString();
                break;
            case "minimum_size_reset":
                brush.setSpacing(default_settings.minimum);
                brushSpacingSlider.value = default_settings.minimum;
                document.getElementById("minimum_size_per").innerText = (default_settings.minimum*100).toString();
                break;
        }
    };
}
/** ---------------- **/

/** -- 独自ツールの処理  --**/
function distanceBetween(lastx, lasty, x, y) {
    return Math.sqrt(Math.pow(x - lastx, 2) + Math.pow(y - lasty, 2));
}
function angleBetween(lastx, lasty, x, y) {
    return Math.atan2(x - lastx, y - lasty);
}
// 合計値の計算
function calcSum(data) {
    let sum = 0;
    for (i = 0; i < data.length; i++) {
        sum = sum + data[i];
    }
    return (sum);
}
// 平均値の計算
function calcAve(data) {
    return (calcSum(data) / data.length);
}
//スポイト
function DripperColor(x, y) {
    try {
      const imagedata = getNowLayerContext().getImageData(x, y, 1, 1);
      // RGBの取得
      const r = imagedata.data[0];
      const g = imagedata.data[1];
      const b = imagedata.data[2];
      const a = imagedata.data[3];
      const rgb = 'rgb(' + r + ',' + g + ',' + b + ')';
      const hex = rgb2hex(rgb);
      picker.setColor(hex);
      easypicker.setColor(hex);
      colorView.style.background = hex;
      easycolorView.style.background = hex;
    }catch (e) {
      console.log(e);
      console.log("not catch dripper");
    }
}
//右クリックからスポイト
function rightClickDripper(e){
    setPointerEvent(e);
    var pointerPosition = getRelativePosition(e.clientX, e.clientY);
    DripperColor(pointerPosition.x, pointerPosition.y);
    return false;
}

//指先ツール
let ghost_layer = document.createElement("canvas");
let ghost_ctx = ghost_layer.getContext("2d");
ghost_layer.width = _width;
ghost_layer.height = _height;
let finger_target_layer = selectLayer;
var target_ctx = croquis.getLayerCanvas(selectLayer).getContext('2d');
function getColorAverage(imageData) {
        const r = [];
        const g = [];
        const b = [];
        const a = [];
        for (let i = 0; i < imageData.data.length / 4; i++) {
            const r_data = imageData.data[4 * i];
            const g_data = imageData.data[4 * i + 1];
            const b_data = imageData.data[4 * i + 2];
            const a_data = imageData.data[4 * i + 3];
            if (a_data != 0) {
                r.push(r_data);
                g.push(g_data);
                b.push(b_data);
                a.push(a_data);
            }
            else {//透明度０の場合、白として扱う
                r.push(255);
                g.push(255);
                b.push(255);
                a.push(0);
            }
        }
        if (r.length != 0) {
            const r_ave = parseInt(calcAve(r));
            const g_ave = parseInt(calcAve(g));
            const b_ave = parseInt(calcAve(b));
            const a_value = parseInt(calcAve(a)) / 255;
            const rgb = 'rgb(' + r_ave + ',' + g_ave + ',' + b_ave + ')';
            const color = rgb2hex(rgb);
            return [color, a_value];
        }
        return ["miss", 0]
    }
function fingerCanvas(x, y, pressure) {
    let lastx = (last_pos.x)? last_pos.x: x;
    let lasty = (last_pos.y)? last_pos.y: y;
    if (Math.abs(lastx-x)>50 || (Math.abs(lasty-y)>50)){
      return false;
    };
    const current_force = (pressure)? pressure: 0;
    if (current_force==0){
      return false;
    }
    if (finger_target_layer != selectLayer){
        target_ctx = croquis.getLayerCanvas(selectLayer).getContext('2d');
        finger_target_layer = selectLayer;
    }
    const adjust_radio = 0.8;
    const paint_width = parseInt(brushSizeSlider.value)/2*adjust_radio;
    const paint_alpha = parseInt(brushOpacitySlider.value);
    const center = paint_width / 2;
    const image_data = target_ctx.getImageData(x - center, y - center, paint_width, paint_width);

    const [color, a_value] = getColorAverage(image_data);

    if (color != "miss") {
        ghost_ctx.clearRect(0, 0, _width, _height);
        const dist = distanceBetween(lastx, lasty, x, y);
        const angle = angleBetween(lastx, lasty, x, y);
        const a_val = (a_value == 0)? 0.1: a_value

        for (let i = 0; i < dist; i += 10) {
            const x = lastx + (Math.sin(angle) * i);
            const y = lasty + (Math.cos(angle) * i);
            const ctx_alpha = paint_alpha * current_force * a_val;
            ghost_ctx.globalAlpha = ctx_alpha;

            let radgrad = ghost_ctx.createRadialGradient(x, y, paint_width / 2, x, y, paint_width);

            const rgb = hex2rgb(color);
            const rgb1 = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0.5)';
            const rgb2 = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0)';
            radgrad.addColorStop(0, color);
            radgrad.addColorStop(0.5, rgb1);
            radgrad.addColorStop(1, rgb2);

            ghost_ctx.fillStyle = radgrad;
            ghost_ctx.fillRect(x - paint_width, y - paint_width, paint_width * 2, paint_width * 2);
        }

        //Single --------------------------------
        // const a_val = (a_value == 0)? 0.1: a_value
        // const ctx_alpha = paint_alpha * a_val;
        // ghost_ctx.globalAlpha = ctx_alpha;
        //
        // let radgrad = ghost_ctx.createRadialGradient(x, y, paint_width / 2, x, y, paint_width);
        //
        // const rgb = hex2rgb(color);
        // console.log(rgb);
        // const rgb1 = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0.5)';
        // const rgb2 = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0)';
        // radgrad.addColorStop(0, color);
        // radgrad.addColorStop(0.5, rgb1);
        // radgrad.addColorStop(1, rgb2);
        //
        // ghost_ctx.fillStyle = radgrad;
        // ghost_ctx.fillRect(x - paint_width, y - paint_width, paint_width * 2, paint_width * 2);
        //-------------------------------------------

        target_ctx.drawImage(ghost_layer, 0, 0);
    }else {
      console.log("miss");
    }
}
/** -------------- **/


/** -- キー入力/アクションバー入力 -- **/
document.addEventListener('keydown', (e) => {
    if (e.keyCode == 80) {//P-標準ペン
        $("#pen").click();
    } else if (e.keyCode == 66) {//B-サブペン
        $("#pencil").click();
    }　else if (e.keyCode == 69) {//E-消しゴム
        $("#eraser").click();
    } else if (e.keyCode == 73) {//I-スポイト
        $("#dropper").click();
    } else if (e.keyCode == 74) {//J-指先/ぼかしツール
        $("#finger").click();
    } else if (e.keyCode == 77) {//M-選択ツール
        $("#area").click();
    }
    //押し間違えでリロードしない
    else if (e.keyCode == 82 && e.ctrlKey) e.preventDefault();
    else if (e.keyCode == 116) e.preventDefault();
});
//もとに戻るボタン
const undo_btn = document.getElementById("undo_btn");
undo_btn.addEventListener("click", (e) => {
    e.preventDefault();
    record_params.undo_count++;
    croquis.undo();
});

//先に進むボタン
const redo_btn = document.getElementById("redo_btn");
redo_btn.addEventListener("click", (e) => {
    e.preventDefault();
    croquis.redo();
});
/** -- ------- -- **/


/** -- 矩形操作レイヤーと操作に必要な設定 -- **/
let rect_layer = document.getElementById("rect_layer");
let rect_ctx = rect_layer.getContext("2d");
let src_canvas = document.getElementById("src_layer");
let src_ctx = src_canvas.getContext("2d");
src_canvas.width = _width;
src_canvas.height = _height;
//ボタンの設定
const rect_confirm_area = document.getElementById("rect_confirm_area");
let RECT_BORDER_WIDTH = 2; // 線の太さ
let rect_sx = rect_sy = 0;
let rect_ex = rect_ey = 0;
let isRectLayer = false;
let isRectShow = false;
let RectInstance;
let default_move_params = {
  dx: 0,
  dy: 0,
  rotate: 0,
  width: 0,
  height: 0,
  clientX: 0,
  clientY: 0,
  isChange: false,
}
let move_params = {
  dx: 0,
  dy: 0,
  rotate: 0,
  width: 0,
  height: 0,
  clientX: 0,
  clientY: 0,
  isChange: false,
}

function defaultSrcMoveParams (){
  rect_sx = 0;
  rect_sy = 0;
  rect_ex = 0;
  rect_ey = 0;
}
function defalutMoveParams() {
  move_params = default_move_params;
  isRectLayer = false;
  isRectShow = false;
}

// 色の反転
function getTurningAround(color) {
    if (color >= 88 && color <= 168) {
        return 255;
        // 色を反転する
    } else {
        return 255 - color;
    }
}

//ツールバーのサイズ取得
function getToolbarHeightSize() {
    let element_y = $("#paint_toolbar_area").height();
    if (document.body.clientWidth < 992){
        const y = $("#left_sidemenu").height();
        element_y = element_y + y
    }
    return element_y
}
//ツールバーのサイズ取得
function getLeftsidemenuWidth() {
    let element_w = $("#left_sidemenu").width();
    if (document.body.clientWidth < 992){
        element_w = 0;
    }
    return element_w
}

//キャンバスを切り取り
function areaCanvasdown(lastx, lasty, x, y) {//start
    if(isRectLayer){

      return false;
    }
    //まだ選択中のrectLayerがない場合
    rect_sx = x;
    rect_sy = y;
    // 矩形キャンバスの非表示
    rect_layer.style.display = 'none';
    // srcキャンバスを表示する
    src_canvas.style.display = "block";
}

//矩形移動
function areaCanvasMove(lastx, lasty, x, y) {
    if(isRectLayer){
      return false;
    }
    rect_ex = x;
    rect_ey = y;
    if (window.navigator.msSaveBlob) {
        if (navigator.userAgent.toLowerCase().indexOf('edge') > -1) {
            return false;
        }
    }
    src_ctx.clearRect(0, 0, _width, _height);//srcキャンバスの更新
    // 矩形の描画
    src_ctx.beginPath();

    src_ctx.strokeStyle = "#ff0000";//赤色の線にする
    src_ctx.lineWidth = RECT_BORDER_WIDTH; //線の太さ
    src_ctx.setLineDash([2, 3]);//点線にする

    // 上
    src_ctx.moveTo(rect_sx, rect_sy);
    src_ctx.lineTo(rect_ex, rect_sy);

    // 下
    src_ctx.moveTo(rect_sx, rect_ey);
    src_ctx.lineTo(rect_ex, rect_ey);

    // 右
    src_ctx.moveTo(rect_ex, rect_sy);
    src_ctx.lineTo(rect_ex, rect_ey);

    // 左
    src_ctx.moveTo(rect_sx, rect_sy);
    src_ctx.lineTo(rect_sx, rect_ey);

    src_ctx.stroke();
}

//矩形表示
function areaCanvasUp(x, y) {
    if (isRectLayer){
      putRectLayer();
      RectInstance = undefined;
      subjx('#rect_layer').off();
      $(".sjx-wrapper").remove();
      return false;
    }
    src_ctx.clearRect(0, 0, _width, _height);//srcキャンバスのクリア
    src_canvas.style.display = "none";

    //選択レイヤーからその箇所の画像を切り取り
    const image_data = croquis.getLayerContext(selectLayer).getImageData(Math.min(rect_sx, rect_ex), Math.min(rect_sy, rect_ey), Math.abs(rect_sx - rect_ex), Math.abs(rect_sy - rect_ey));
    //undoストックに保存する
    croquis.pushDirtyRectUndo(0, 0, _width, _height, selectLayer);
    croquis.getLayerContext(selectLayer).clearRect(Math.min(rect_sx, rect_ex), Math.min(rect_sy, rect_ey), Math.abs(rect_sx - rect_ex), Math.abs(rect_sy - rect_ey));

    //rectレイヤーのサイズを決める
    rect_layer.width = Math.abs(rect_sx - rect_ex);
    rect_layer.height = Math.abs(rect_sy - rect_ey);
    move_params.width = Math.abs(rect_sx - rect_ex);
    move_params.height = Math.abs(rect_sy - rect_ey);
    rect_layer.style.display = "block";
    const rect_data = canvasArea.getBoundingClientRect();
    const toolbar_y = getToolbarHeightSize();
    const left_side_menu = getLeftsidemenuWidth();
    const recty = Math.min(rect_sy, rect_ey) + rect_data.y - toolbar_y;
    const rectx = Math.min(rect_sx, rect_ex) + rect_data.x - left_side_menu;
    rect_layer.style.top = recty + "px";
    rect_layer.style.left = rectx + "px";

    //張り付ける
    rect_ctx.putImageData(image_data, 0, 0);
    //
    if (RectInstance){
      RectInstance = undefined;
      subjx('#rect_layer').off();
      $(".sjx-wrapper").remove();
    }
    RectInstance = subjx('#rect_layer').drag({
      container: '#canvas_area',
      snap: {
          x: 1,
          y: 1,
          angle: 1
      },
      each: {
        move: true,
        resize: true,
        rotate: false
      },
      rotatable: false,
      onMove(params){
        move_params.isChange = true;
        move_params.dx = rectx + params.dx;
        move_params.dy = recty + params.dy;
        move_params.clientX = params.clientX;
        move_params.clientY = params.clientY;
      },
      onResize({clientX, clientY, dx, dy, width, height}) {
        move_params.isChange = true;
        move_params.width = width;
        move_params.height = height;
      },
      onRotate({clientX, clientY, delta, transform}) {
        move_params.isChange = true;
        const cos = transform[0];
        const sin = transform[1];
        const tan = transform[2];
        const deg = Math.atan2(sin, cos)/3.14;
        let degree;
        if (deg > 0){}
      }
    });
    // $(".sjx-wrapper").show();
    isRectLayer = true;
    defaultSrcMoveParams();//default値に戻す。
}

function putRectLayer(){
  if (!move_params.isChange){//変更がない場合は、戻る
    RectInstance = undefined;
    subjx('#rect_layer').off();
    $(".sjx-wrapper").remove();
    croquis.undo();
    rect_layer.style.display = "none";
    isRectLayer = false;
    return
  }
  let createRectCanvas = document.createElement("canvas");
  const w = move_params.width;
  const h = move_params.height;
  createRectCanvas.width = rect_layer.width;
  createRectCanvas.height = rect_layer.height;
  let createRectCtx = createRectCanvas.getContext("2d");
  createRectCtx.drawImage(rect_layer, 0, 0);
  createRectCtx.restore();
  const rect_layer_data = rect_layer.getBoundingClientRect();
  const canvas_area_data = canvasArea.getBoundingClientRect();
  const x = rect_layer_data.x - canvas_area_data.x;
  const y = rect_layer_data.y - canvas_area_data.y;
  console.log(move_params);
  croquis.getLayerContext(selectLayer).drawImage(createRectCanvas
    , x, y, move_params.width, move_params.height);
  console.log("check");
  subjx('#rect_layer').off();
  $(".sjx-wrapper").remove();
  rect_layer.style.display = "none";

  //最後にデフォルト値に戻す
  isRectLayer = false;
  defaultSrcMoveParams();
  defalutMoveParams();
}

// $("#rect_layer").easyDrag({'container': $("#canvas_area")});

/** ------------------------------------ **/

/** ナビゲータの設定 **/
let canvas_navigator = document.getElementById("canvas_navigator");
let canvas_navigator_ctx = canvas_navigator.getContext("2d");
const navigator_viewer = document.getElementById("navigator_viewer");
canvas_navigator.width = navigator_viewer.clientWidth;
canvas_navigator.height = navigator_viewer.clientHeight;
let isReversal = false;
function drawNavigator() {
    const navigater_width = canvas_navigator.width;
    const navigator_height = canvas_navigator.height;
    canvas_navigator_ctx.drawImage(record_layer, 0, 0
      , navigator_height*_width/_height, navigator_height);
}
// drawNavigator();//初期起動;
setTimeout(drawNavigator, 1000)

//反転ボタンを押した場合の処理
document.getElementById("reversal_canvas_btn").onclick = () => {navigatorReverse();};
document.getElementById("right_rotate_canvas_btn").onclick = () => {navigatorRotate("right");};
document.getElementById("left_rotate_canvas_btn").onclick = () => {navigatorRotate("left");};
let rotate_y = 0;
let rotate_x = 0;
function navigatorReverse() {
    if(rotate_y == 0){rotate_y = 1;}
    else {rotate_y = 0;}
    navigatorTransform();
}
function navigatorRotate(direction) {
    if(direction=="right"){rotate_x += 0.1;}
    else{rotate_x -= 0.1;}
    navigatorTransform();
}
function navigatorTransform() {
    const value = "rotate3d("+rotate_x.toString()+","+rotate_y.toString()+",0,180deg)";
    canvas_navigator.style.transform = value;
}
/** ------------------- **/

/** -- モチーフビューの操作 -- **/
if ($("#motif").data("motif_id") !== undefined){
    $("#motif_viewer").easyDrag({"handle": $("#motif_viewer_title")});
    const motifviewer_btn = document.getElementById("motif_viewer_btn");
    const close_motif_viewer = document.getElementById("close_motif_viewer");
    motifviewer_btn.addEventListener("click", closeMotifviewer);
    close_motif_viewer.addEventListener("click", closeMotifviewer);
    const close_motif_viewer_btn = document.getElementById("close_motif_viewer_btn");
    close_motif_viewer_btn.addEventListener("click", closeMotifviewer);
    function closeMotifviewer(event) {
        const motif_viewer_display = motif_viewer.style.display;
        if (motif_viewer_display != "block") {
            motif_viewer.style.display = "block";
            if (!motif_viewer_btn.classList.contains("action-selected")){
              motif_viewer_btn.classList.add("action-selected");
            }
        } else {
            motif_viewer.style.display = "none";
            motif_viewer_btn.classList.remove("action-selected");
        }
    }
    const expand_motif_viewer = document.getElementById("expand_motif_viewer");
    expand_motif_viewer.addEventListener("click", ()=>{
        $("#motif_viewer").width("+=50");
    });
    const compress_motif_viewer = document.getElementById("compress_motif_viewer");
    compress_motif_viewer.addEventListener("click", ()=>{
        $("#motif_viewer").width("-=50");
    });
}
function setMotifColor(color) {
    picker.setColor(color);
    easypicker.setColor(color);
    colorView.style.background = color;
    easycolorView.style.background = color;
}
/** -- ------- -- **/

/** -- ルームビューの操作 -- **/
if ($("#room_data").data("room_id") !== undefined){
    $("#room_viewer").easyDrag({"handle": $("#room_viewer_title")});
    const room_viewer_btn = document.getElementById("room_viewer_btn");
    const close_room_viewer = document.getElementById("close_room_viewer");
    room_viewer_btn.addEventListener("click", closeRoomviewer);
    close_room_viewer.addEventListener("click", closeRoomviewer);
    function closeRoomviewer(event) {
        const room_viewer_display = room_viewer.style.display;
        if (room_viewer_display != "block") {
            room_viewer.style.display = "block";
            if (!room_viewer_btn.classList.contains("action-selected")){
              room_viewer_btn.classList.add("action-selected");
            }
        } else {
            room_viewer.style.display = "none";
            room_viewer_btn.classList.remove("action-selected");
        }
    }
    const expand_room_viewer = document.getElementById("expand_room_viewer");
    expand_room_viewer.addEventListener("click", ()=>{
        $("#room_viewer").width("+=50");
    });
    const compress_room_viewer = document.getElementById("compress_room_viewer");
    compress_room_viewer.addEventListener("click", ()=>{
        $("#room_viewer").width("-=50");
    });
}
/** -- ------- -- **/

/** --  コースビューの操作  -- **/
if ($("#course_data").data("course_id") !== undefined){
    $("#course_viewer").easyDrag({"handle": $("#course_viewer_title")});
    const course_viewer = document.getElementById("course_viewer");
    const course_viewer_btn = document.getElementById("course_viewer_btn");
    const close_course_viewer = document.getElementById("close_course_viewer");
    course_viewer_btn.addEventListener("click", closeCourseviewer);
    close_course_viewer.addEventListener("click", closeCourseviewer);
    function closeCourseviewer(event) {
        const course_viewer_display = course_viewer.style.display;
        if (course_viewer_display != "block") {
            course_viewer.style.display = "block";
            if (!course_viewer_btn.classList.contains("action-selected")){
              course_viewer_btn.classList.add("action-selected");
            }
        } else {
            course_viewer.style.display = "none";
            course_viewer_btn.classList.remove("action-selected");
        }
    }
    const expand_course_viewer = document.getElementById("expand_course_viewer");
    expand_course_viewer.addEventListener("click", ()=>{
        $("#course_viewer").width("+=50");
    });
    const compress_course_viewer = document.getElementById("compress_course_viewer");
    compress_course_viewer.addEventListener("click", ()=>{
        $("#course_viewer").width("-=50");
    });
}
/** -- ------------------ -- **/

/** -- 簡易カラーピッカー -- **/
$("#easy_color_control_area").easyDrag({"handle": $("#easy_color_title")});
/** -- ---------------- -- **/

/** -- 外部利用用Functions -- **/
// base64画像をベースキャンバスに張り付ける(参加型配信用)
function putImageBase64ToBaseCanvas(image_base64) {
  target_base_ctx = croquis.getLayerContext(0);
  var target_base_dimg = new Image();
  target_base_dimg.src = image_base64;
  target_base_dimg.onload = function(){
    target_base_ctx.clearRect(0, 0, wd, hd);
    target_base_ctx.drawImage(target_base_dimg, 0, 0, target_base_dimg.width, target_base_dimg.height
      , 0, 0, wd, hd);
  }
}
// 現在の描画データをBase64で取得する(参加型配信用)
function getPaintDataBase64forRoom() {
  return croquis.getLayerCanvas(selectLayer).toDataURL("image/png");
}
/** -- ------------------ -- **/

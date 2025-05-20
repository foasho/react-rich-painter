const width = $("#default_layer").width();
const height = $("#default_layer").height();
function Croquis(imageDataList, properties) {
    var self = this;
    if (properties != null)
        for (var property in properties)
            self[property] = properties[property];
    var domElement = document.createElement("div");
    domElement.style.clear = "both";
    domElement.style.setProperty("user-select", "none");
    domElement.style.setProperty("-webkit-user-select", "none");
    domElement.style.setProperty("-ms-user-select", "none");
    domElement.style.setProperty("-moz-user-select", "none");
    self.getDOMElement = function () {
        return domElement;
    };
    self.getRelativePosition = function (absoluteX, absoluteY) {
        var rect = domElement.getBoundingClientRect();
        return {x: absoluteX - rect.left,y: absoluteY - rect.top};
    };
    var undoStack = [];
    var redoStack = [];
    var undoLimit = 50;
    var preventPushUndo = false;
    var pushToTransaction = false;
    self.getUndoLimit = function () {
        return undoLimit;
    };
    self.setUndoLimit = function (limit) {
        undoLimit = limit;
    };
    self.lockHistory = function () {
        preventPushUndo = true;
    };
    self.unlockHistory = function () {
        preventPushUndo = false;
    };
    self.beginHistoryTransaction = function () {
        undoStack.push([]);
        pushToTransaction = true;
    };
    self.endHistoryTransaction = function () {
        pushToTransaction = false;
    };
    self.clearHistory = function () {
        if (preventPushUndo)
            throw "history is locked";
        undoStack = [];
        redoStack = [];
    };
    function pushUndo(undoFunction) {
        if (self.onChanged)
            self.onChanged();
        if (preventPushUndo)
            return;
        redoStack = [];
        if (pushToTransaction)
            undoStack[undoStack.length - 1].push(undoFunction);
        else
            undoStack.push([undoFunction]);
        while (undoStack.length > undoLimit)
            undoStack.shift();
        pasteCanvastoRecordLayer();//録画レイヤーに描画
    }
    self.pushUndo = function(undoFunction) {
        if (self.onChanged)
            self.onChanged();
        if (preventPushUndo)
            return;
        redoStack = [];
        if (pushToTransaction)
            undoStack[undoStack.length - 1].push(undoFunction);
        else
            undoStack.push([undoFunction]);
        while (undoStack.length > undoLimit)
            undoStack.shift();
        pasteCanvastoRecordLayer();//録画レイヤーに描画
    };
    self.undo = function () {
        if (pushToTransaction)
            throw "transaction is not ended";
        if (preventPushUndo)
            throw "history is locked";
        if (isDrawing || isStabilizing)
            throw "still drawing";
        if (undoStack.length == 0)
            throw "no more undo data";
        var undoTransaction = undoStack.pop();
        var redoTransaction = [];
        while (undoTransaction.length)
            redoTransaction.push(undoTransaction.pop()());
        redoStack.push(redoTransaction);
        pasteCanvastoRecordLayer();//録画レイヤーに描画
    };
    self.redo = function () {
        if (pushToTransaction)
            throw "transaction is not ended";
        if (preventPushUndo)
            throw "history is locked";
        if (isDrawing || isStabilizing)
            throw "still drawing";
        if (redoStack.length == 0)
            throw "no more redo data";
        var redoTransaction = redoStack.pop();
        var undoTransaction = [];
        while (redoTransaction.length)
            undoTransaction.push(redoTransaction.pop()());
        undoStack.push(undoTransaction);
        //console.log("元に戻る　されました");
        //console.log(undoTransaction);//関数ごと渡してる！！？？
        pasteCanvastoRecordLayer();
    };
    //レイヤー透明度をundoストックに追加
    function pushLayerOpacityUndo(index) {
        index = (index == null) ? layerIndex : index;
        var snapshotOpacity = self.getLayerOpacity(index);
        var swap = function () {
            self.lockHistory();
            var temp = self.getLayerOpacity(index);
            self.setLayerOpacity(snapshotOpacity, index);
            snapshotOpacity = temp;
            self.unlockHistory();
            return swap;
        };
        pushUndo(swap);
    }
    //レイヤー表示非表示をUndoストックに追加
    function pushLayerVisibleUndo(index) {
        index = (index == null) ? layerIndex : index;
        var snapshotVisible = self.getLayerVisible(index);
        var swap = function () {
            self.lockHistory();
            var temp = self.getLayerVisible(index);
            self.setLayerVisible(snapshotVisible, index);
            snapshotVisible = temp;
            self.unlockHistory();
            return swap;
        };
        pushUndo(swap);
    }
    //レイヤー位置交換をundoストックに追加
    function pushSwapLayerUndo(layerA, layerB) {
        var swap = function () {
            self.lockHistory();
            self.swapLayer(layerA, layerB);
            self.unlockHistory();
            return swap;
        };
        pushUndo(swap);
    }
    //レイヤー追加をundoストックに追加
    function pushAddLayerUndo(index) {
        var add = function () {
            self.lockHistory();
            self.addLayer(index);
            self.unlockHistory();
            return remove;
        };
        var remove = function () {
            self.lockHistory();
            self.removeLayer(index);
            self.unlockHistory();
            return add;
        };
        pushUndo(remove);
    }
    //レイヤー削除をundoストックに追加
    function pushRemoveLayerUndo(index) {
        var layerContext = getLayerContext(index);
        var w = size.width;
        var h = size.height;
        var snapshotData = layerContext.getImageData(0, 0, w, h);
        var add = function () {
            self.lockHistory();
            self.addLayer(index);
            var layerContext = getLayerContext(index);
            layerContext.putImageData(snapshotData, 0, 0);
            self.unlockHistory();
            return remove;
        };
        var remove = function () {
            self.lockHistory();
            self.removeLayer(index);
            self.unlockHistory();
            return add;
        };
        pushUndo(add);
    }
    //テクスチャの選択をUndoストックに追加
    function pushDirtyRectUndo(x, y, width, height, index) {
        index = (index == null) ? layerIndex : index;
        var w = size.width;
        var h = size.height;
        var right = x + width;
        var bottom = y + height;
        x = Math.min(w, Math.max(0, x));
        y = Math.min(h, Math.max(0, y));
        width = Math.min(w, Math.max(x, right)) - x;
        height = Math.min(h, Math.max(y, bottom)) - y;
        if ((x % 1) > 0)
            ++width;
        if ((y % 1) > 0)
            ++height;
        x = x | 0;
        y = y | 0;
        width = Math.min(w - x, Math.ceil(width));
        height = Math.min(h - y, Math.ceil(height));
        if ((width == 0) || (height == 0)) {
            var doNothing = function () {
                return doNothing;
            };
            pushUndo(doNothing);
        }
        else {
          try {
            var layerContext = getLayerContext(index);
            var snapshotData = layerContext.getImageData(x, y, width, height);
            var swap = function () {
              layerContext = getLayerContext(index);
              tempData = layerContext.getImageData(x, y, width, height);
              layerContext.putImageData(snapshotData, x, y);
              snapshotData = tempData;
              return swap;
            };
            pushUndo(swap);
          }catch (e) {
            console.log("undo stock false");
          }
        }
        if (renderDirtyRect)
            drawDirtyRect(x, y, width, height);
    }
    //追加
    self.pushDirtyRectUndo = function(x, y, width, height, index) {
        index = (index == null) ? layerIndex : index;
        var w = size.width;
        var h = size.height;
        var right = x + width;
        var bottom = y + height;
        x = Math.min(w, Math.max(0, x));
        y = Math.min(h, Math.max(0, y));
        width = Math.min(w, Math.max(x, right)) - x;
        height = Math.min(h, Math.max(y, bottom)) - y;
        if ((x % 1) > 0)
            ++width;
        if ((y % 1) > 0)
            ++height;
        x = x | 0;
        y = y | 0;
        width = Math.min(w - x, Math.ceil(width));
        height = Math.min(h - y, Math.ceil(height));
        if ((width == 0) || (height == 0)) {
            var doNothing = function () {
                return doNothing;
            };
            pushUndo(doNothing);
        }
        else {
            var layerContext = getLayerContext(index);
            var snapshotData = layerContext.getImageData(x, y, width, height);
            var swap = function () {
                var layerContext = getLayerContext(index);
                var tempData = layerContext.getImageData(x, y, width, height);
                layerContext.putImageData(snapshotData, x, y);
                snapshotData = tempData;
                return swap;
            };
            pushUndo(swap);
        }
        if (renderDirtyRect)
            drawDirtyRect(x, y, width, height);
    };
    function pushContextUndo(index) {
        index = (index == null) ? layerIndex : index;
        pushDirtyRectUndo(0, 0, size.width, size.height, index);
    }
    //追加
    self.pushContextUndo = function(index){
        index = (index == null) ? layerIndex : index;
        pushDirtyRectUndo(0, 0, size.width, size.height, index);
    };
    function pushAllContextUndo() {
        var snapshotDatas = [];
        var i;
        var w = size.width;
        var h = size.height;
        for (i = 0; i < layers.length; ++i) {
            var layerContext = getLayerContext(i);
            snapshotDatas.push(layerContext.getImageData(0, 0, w, h));
        }
        var swap = function (index) {
            var layerContext = getLayerContext(index);
            var tempData = layerContext.getImageData(0, 0, w, h);
            layerContext.putImageData(snapshotDatas[index], 0, 0);
            snapshotDatas[index] = tempData;
        };
        var swapAll = function () {
            for (var i = 0; i < layers.length; ++i)
                swap(i);
            return swapAll;
        };
        pushUndo(swapAll);
    }
    //キャンバスサイズの変更をundoStackに追加
    function pushCanvasSizeUndo(width, height, offsetX, offsetY) {
        var snapshotSize = self.getCanvasSize();
        var snapshotDatas = [];
        var w = snapshotSize.width;
        var h = snapshotSize.height;
        for (var i = 0; i < layers.length; ++i) {
            var layerContext = getLayerContext(i);
            snapshotDatas[i] = layerContext.getImageData(0, 0, w, h);
        }
        function setSize(width, height, offsetX, offsetY) {
            self.lockHistory();
            self.setCanvasSize(width, height, offsetX, offsetY);
            self.unlockHistory();
        }
        var rollback = function () {
            setSize(w, h);
            for (var i = 0; i < layers.length; ++i) {
                var layerContext = getLayerContext(i);
                layerContext.putImageData(snapshotDatas[i], 0, 0);
            }
            return redo;
        };
        var redo = function () {
            rollback();
            setSize(width, height, offsetX, offsetY);
            return rollback;
        };
        pushUndo(rollback);
    }
    var size = {width: width, height: height};
    self.getCanvasSize = function () {
        return {width: size.width, height: size.height};
    };
    self.setCanvasSize = function (width, height, offsetX, offsetY) {
        offsetX = (offsetX == null) ? 0 : offsetX;
        offsetY = (offsetY == null) ? 0 : offsetY;
        pushCanvasSizeUndo(width, height, offsetX, offsetY);
        size.width = width = Math.floor(width);
        size.height = height = Math.floor(height);
        paintingCanvas.width = width;
        paintingCanvas.height = height;
        dirtyRectDisplay.width = width;
        dirtyRectDisplay.height = height;
        domElement.style.width = width + "px";
        domElement.style.height = height + "px";
        for (var i=0; i<layers.length; ++i) {
            var canvas = getLayerCanvas(i);
            var context = getLayerContext(i);
            var imageData = context.getImageData(0, 0, width, height);
            canvas.width = width;
            canvas.height = height;
            context.putImageData(imageData, offsetX, offsetY);
        }
    };
    self.getCanvasWidth = function () {
        return size.width;
    };
    self.setCanvasWidth = function (width, offsetX) {
        self.setCanvasSize(width, size.height, offsetX, 0);
    };
    self.getCanvasHeight = function () {
        return size.height;
    };
    self.setCanvasHeight = function (height, offsetY) {
        self.setCanvasSize(size.width, height, 0, offsetY);
    };
    function getLayerCanvas(index) {
        return layers[index].getElementsByClassName("croquis-layer-canvas")[0];
    }
    self.getLayerCanvas = getLayerCanvas;
    function getLayerContext(index) {
        return getLayerCanvas(index).getContext("2d");
    }
    self.getLayerContext = getLayerContext;
    var layers = [];
    var layerIndex = 0;
    var paintingCanvas = document.createElement("canvas");
    var paintingContext = paintingCanvas.getContext("2d");
    paintingCanvas.className = "croquis-painting-canvas";
    paintingCanvas.style.position = "absolute";
    var dirtyRectDisplay = document.createElement("canvas");
    var dirtyRectDisplayContext = dirtyRectDisplay.getContext("2d");
    dirtyRectDisplay.className = "croquis-dirty-rect-display";
    dirtyRectDisplay.style.position = "absolute";
    var renderDirtyRect = false;
    function sortLayers() {
        while (domElement.firstChild)
            domElement.removeChild(domElement.firstChild);
        for (var i = 0; i < layers.length; ++i) {
            var layer = layers[i];
            domElement.appendChild(layer);
        }
        domElement.appendChild(dirtyRectDisplay);
    }
    function drawDirtyRect(x, y, w, h) {
        var context = dirtyRectDisplayContext;
        context.fillStyle = "#f00";
        context.globalCompositeOperation = "source-over";
        context.fillRect(x, y, w, h);
        if ((w > 2) && (h > 2)) {
            context.globalCompositeOperation = "destination-out";
            context.fillRect(x + 1, y + 1, w - 2, h - 2);
        }
    }
    self.getRenderDirtyRect = function () {
        return renderDirtyRect;
    };
    self.setRenderDirtyRect = function (render) {
        renderDirtyRect = render;
        if (render == false)
            dirtyRectDisplayContext.clearRect(0, 0, size.width, size.height);
    };
    self.createLayerThumbnail = function (index, width, height) {
        index = (index == null) ? layerIndex : index;
        width = (width == null) ? size.width : width;
        height = (height == null) ? size.height : height;
        var canvas = getLayerCanvas(index);
        var thumbnail = document.createElement("canvas");
        var thumbnailContext = thumbnail.getContext("2d");
        thumbnail.width = width;
        thumbnail.height = height;
        thumbnailContext.drawImage(canvas, 0, 0, width, height);
        return thumbnail;
    };
    self.createFlattenThumbnail = function (width, height) {
        width = (width == null) ? size.width : width;
        height = (height == null) ? size.height : height;
        var thumbnail = document.createElement("canvas");
        var thumbnailContext = thumbnail.getContext("2d");
        thumbnail.width = width;
        thumbnail.height = height;
        for (var i = 0; i < layers.length; ++i) {
            if (!self.getLayerVisible(i))
                continue;
            var canvas = getLayerCanvas(i);
            thumbnailContext.globalAlpha = self.getLayerOpacity(i);
            thumbnailContext.drawImage(canvas, 0, 0, width, height);
        }
        //描画中のデータもPUTする
        if (paintingCanvas){
          var copyPaintCanvas = document.createElement("canvas");
          copyPaintCanvas.width = width;
          copyPaintCanvas.height = height;
          var copyPaintCtx = copyPaintCanvas.getContext("2d");
          copyPaintCtx.globalAlpha = self.getPaintingOpacity();
          copyPaintCtx.drawImage(paintingCanvas, 0, 0, width, height);
          thumbnailContext.drawImage(copyPaintCanvas, 0, 0, width, height);
        }
        return thumbnail;
    };
    self.getLayers = function () {
        return layers.concat(); //clone layers
    };
    self.getLayerCount = function () {
        return layers.length;
    };
    //レイヤーの追加処理
    self.addLayer = function (index) {
        index = (index == null) ? layers.length : index;
        //pushAddLayerUndo(index);//undoに対応させない
        var layer = document.createElement("div");
        layer.className = "croquis-layer";
        layer.style.visibility = "visible";
        layer.style.opacity = 1;
        var canvas = document.createElement("canvas");
        canvas.className = "croquis-layer-canvas";
        canvas.width = size.width;
        canvas.height = size.height;
        canvas.style.position = "absolute";
        layer.appendChild(canvas);
        domElement.appendChild(layer);
        layers.splice(index, 0, layer);
        if (self.onLayerAdded)
            self.onLayerAdded(index);
        return layer;
    };
    //レイヤーの削除処理
    self.removeLayer = function (index) {
        index = (index == null) ? layerIndex : index;
        pushRemoveLayerUndo(index);
        domElement.removeChild(layers[index]);
        layers.splice(index, 1);
        if (layerIndex == layers.length)
            self.selectLayer(layerIndex - 1);
        sortLayers();
        if (self.onLayerRemoved)
            self.onLayerRemoved(index);
    };
    //レイヤーの全削除
    self.removeAllLayer = function () {
        while (layers.length)
            self.removeLayer(0);
    };
    //レイヤーの位置交換
    self.swapLayer = function (layerA, layerB) {
        //pushSwapLayerUndo(layerA, layerB);//undoは無効化しておく
        var layer = layers[layerA];
        layers[layerA] = layers[layerB];
        layers[layerB] = layer;
        sortLayers();
        if (self.onLayerSwapped)
            self.onLayerSwapped(layerA, layerB);
    };
    //現在のレイヤーIndex取得
    self.getCurrentLayerIndex = function () {
        return layerIndex;
    };
    //レイヤー選択処理
    self.selectLayer = function (index) {
        var lastestLayerIndex = layers.length - 1;
        if (index > lastestLayerIndex)
            index = lastestLayerIndex;
        layerIndex = index;
        if (paintingCanvas.parentElement != null)
            paintingCanvas.parentElement.removeChild(paintingCanvas);
        layers[index].appendChild(paintingCanvas);
        if (self.onLayerSelected)
            self.onLayerSelected(index);
    };
    //レイヤークリア処理
    self.clearLayer = function (index) {
        index = (index == null) ? layerIndex : index;
        pushContextUndo(index);
        var context = getLayerContext(index);
        context.clearRect(0, 0, size.width, size.height);
    };
    //レイヤー塗りつぶし処理
    self.fillLayer = function (fillColor, index) {
        index = (index == null) ? layerIndex : index;
        pushContextUndo(index);
        var context = getLayerContext(index);
        context.fillStyle = fillColor;
        context.fillRect(0, 0, size.width, size.height);
    };
    //四角塗りつぶし処理
    self.fillLayerRect = function (fillColor, x, y, width, height, index) {
        index = (index == null) ? layerIndex : index;
        pushDirtyRectUndo(x, y, width, height, index);
        var context = getLayerContext(index);
        context.fillStyle = fillColor;
        context.fillRect(x, y, width, height);
    };
    //塗りつぶし処理
    self.floodFill = function (x, y, r, g, b, a, index) {
        index = (index == null) ? layerIndex : index;
        pushContextUndo(index);
        var context = getLayerContext(index);
        var w = size.width;
        var h = size.height;
        if ((x < 0) || (x >= w) || (y < 0) || (y >= h))
            return;
        var imageData = context.getImageData(0, 0, w, h);
        var d = imageData.data;
        var targetColor = getColor(x, y);
        var replacementColor = (r << 24) | (g << 16) | (b << 8) | a;
        if (targetColor === replacementColor)
            return;
        function getColor(x, y) {
            var index = ((y * w) + x) * 4;
            return ((d[index] << 24) | (d[index + 1] << 16) |
                (d[index + 2] << 8) | d[index + 3]);
        }
        function setColor(x, y) {
            var index = ((y * w) + x) * 4;
            d[index] = r;
            d[index + 1] = g;
            d[index + 2] = b;
            d[index + 3] = a;
        }
        var queue = [];
        queue.push(x, y);
        while (queue.length) {
            var nx = queue.shift();
            var ny = queue.shift();
            if ((nx < 0) || (nx >= w) || (ny < 0) || (ny >= h) ||
                (getColor(nx, ny) !== targetColor))
                continue;
            var west, east;
            west = east = nx;
            do {
                var wc = getColor(--west, ny);
            } while ((west >= 0) && (wc === targetColor));
            do {
                var ec = getColor(++east, ny);
            } while ((east < w) && (ec === targetColor));
            for (var i = west + 1; i < east; ++i) {
                setColor(i, ny);
                var north = ny - 1;
                var south = ny + 1;
                if (getColor(i, north) === targetColor)
                    queue.push(i, north);
                if (getColor(i, south) === targetColor)
                    queue.push(i, south);
            }
        }
        context.putImageData(imageData, 0, 0);
    };
    self.getLayerOpacity = function (index) {
        index = (index == null) ? layerIndex : index;
        var opacity = parseFloat(
            layers[index].style.getPropertyValue("opacity"));
        return window.isNaN(opacity) ? 1 : opacity;
    };
    self.setLayerOpacity = function (opacity, index) {
        index = (index == null) ? layerIndex : index;
        pushLayerOpacityUndo(index);
        layers[index].style.opacity = opacity;
    };
    self.getLayerVisible = function (index) {
        index = (index == null) ? layerIndex : index;
        var visible = layers[index].style.getPropertyValue("visibility");
        return visible != "hidden";
    };
    self.setLayerVisible = function (visible, index) {
        index = (index == null) ? layerIndex : index;
        pushLayerVisibleUndo(index);
        layers[index].style.visibility = visible ? "visible" : "hidden";
    };
    var tool;
    var toolStabilizeLevel = 0;
    var toolStabilizeWeight = 0.8;
    var stabilizer = null;
    var stabilizerInterval = 5;
    var tick;
    var tickInterval = 20;
    var paintingOpacity = 1;
    var paintingKnockout = false;
    var paintingFinger = false;//add
    var paintingClipping = false;
    self.getTool = function () {
        return tool;
    };
    self.setTool = function (value) {
        tool = value;
        paintingContext = paintingCanvas.getContext("2d");
        if (tool.setContext)
            tool.setContext(paintingContext);
    };
    self.setTool(new Croquis.Brush());
    self.getPaintingOpacity = function () {
        return paintingOpacity;
    };
    self.setPaintingOpacity = function (opacity) {
        paintingOpacity = opacity;
        paintingCanvas.style.opacity = opacity;
    };
    self.getPaintingKnockout = function () {
        return paintingKnockout;
    };
    self.getPaintingClipping = function () {
        return paintingClipping;
    };
    self.setPaintingKnockout = function (knockout) {//set: Eraser
        paintingKnockout = knockout;
        paintingCanvas.style.visibility = knockout ? "hidden" : "visible";
    };
    //追加：指ぼかしツール
    self.getPaintingFinger = function () {
        return paintingFinger;
    };
    self.setPaintingFinger = function (finger){
      paintingFinger = knockout;
    }
    self.setPaintingClipping = function (clipping) {
        paintingClipping = clipping;
    };
    self.getTickInterval = function () {
        return tickInterval;
    };
    self.setTickInterval = function (interval) {
        tickInterval = interval;
    };
    /*- 安定レベル -*/
    self.getToolStabilizeLevel = function () {
        return toolStabilizeLevel;
    };
    self.setToolStabilizeLevel = function (level) {
        toolStabilizeLevel = (level < 0) ? 0 : level;
    };
    /*- 筆の重さレベル -*/
    self.getToolStabilizeWeight = function () {
        return toolStabilizeWeight;
    };
    self.setToolStabilizeWeight = function (weight) {
        toolStabilizeWeight = weight;
    };
    self.getToolStabilizeInterval = function () {
        return stabilizerInterval;
    };
    self.setToolStabilizeInterval = function (interval) {
        stabilizerInterval = interval;
    };
    var isDrawing = false;
    var isStabilizing = false;
    var beforeKnockout = document.createElement("canvas");
    var knockoutTick;
    var knockoutTickInterval = 20;
    function gotoBeforeKnockout() {
        var context = getLayerContext(layerIndex);
        var w = size.width;
        var h = size.height;
        context.clearRect(0, 0, w, h);
        context.drawImage(beforeKnockout, 0, 0, w, h);
    }
    //paintingCanvasを現在のレイヤーに描画する
    function drawPaintingCanvas() {
        var context = getLayerContext(layerIndex);
        var w = size.width;
        var h = size.height;
        context.save();
        context.globalAlpha = paintingOpacity;
        context.globalCompositeOperation = paintingKnockout ?
            "destination-out" : "source-over";
        context.drawImage(paintingCanvas, 0, 0, w, h);
        context.restore();
    }
    //描いてる途中
    function _move(x, y, pressure) {
        if (tool.move)
            tool.move(x, y, pressure);
        if (self.onMoved)
            self.onMoved(x, y, pressure);
    }
    //描き終わり
    function _up(x, y, pressure) {
        isDrawing = false;
        isStabilizing = false;
        var dirtyRect;
        if (tool.up)
            dirtyRect = tool.up(x, y, pressure);
        if (paintingKnockout)
            gotoBeforeKnockout();
        if (dirtyRect)
            pushDirtyRectUndo(dirtyRect.x, dirtyRect.y,
                              dirtyRect.width, dirtyRect.height);
        else
            pushContextUndo();
        drawPaintingCanvas();
        paintingContext.clearRect(0, 0, size.width, size.height);
        if (self.onUpped)
            self.onUpped(x, y, pressure, (dirtyRect != null) ? dirtyRect :
                {x: 0, y: 0, width: size.width, height: size.height});
        window.clearInterval(knockoutTick);
        window.clearInterval(tick);
    }
    //描き始め
    self.down = function (x, y, pressure) {
        if (isDrawing || isStabilizing)
            throw "still drawing";
        isDrawing = true;
        if (paintingKnockout) {
            var w = size.width;
            var h = size.height;
            var canvas = getLayerCanvas(layerIndex);
            var beforeKnockoutContext = beforeKnockout.getContext("2d");
            beforeKnockout.width = w;
            beforeKnockout.height = h;
            beforeKnockoutContext.clearRect(0, 0, w, h);
            beforeKnockoutContext.drawImage(canvas, 0, 0, w, h);
        }
        pressure = (pressure == null) ? Croquis.Tablet.pressure() : pressure;
        var down = tool.down;
        if (toolStabilizeLevel > 0) {
            stabilizer = new Croquis.Stabilizer(down, _move, _up,
                toolStabilizeLevel, toolStabilizeWeight,
                x, y, pressure, stabilizerInterval);
            isStabilizing = true;
        }
        else if (down != null)
            down(x, y, pressure);
        if (self.onDowned)
            self.onDowned(x, y, pressure);
        knockoutTick = window.setInterval(function () {
            if (paintingKnockout) {
                gotoBeforeKnockout();
                drawPaintingCanvas();
            }
        }, knockoutTickInterval);
        tick = window.setInterval(function () {
            if (tool.tick)
                tool.tick();
            if (self.onTicked)
                self.onTicked();
        }, tickInterval);
    };
    self.move = function (x, y, pressure) {
        if (isDrawing) {
            pressure = (pressure == null) ? Croquis.Tablet.pressure() : pressure;
            if (stabilizer != null)
              stabilizer.move(x, y, pressure);
            else if (!isStabilizing)
              _move(x, y, pressure);
        }
    };
    self.up = function (x, y, pressure) {
        if (!isDrawing)
            throw "you need to call \"down\" first";
        pressure = (pressure == null) ? Croquis.Tablet.pressure() : pressure;
        if (stabilizer != null)
            stabilizer.up(x, y, pressure);
        else
            _up(x, y, pressure);
        stabilizer = null;
    };
    (function (croquis, imageDataList) {
        if (imageDataList != null) {
            if (imageDataList.length == 0)
                return;
            croquis.lockHistory();
            var first = imageDataList[0];
            croquis.setCanvasSize(first.width, first.height);
            for (var i = 0; i < imageDataList.length; ++i) {
                var current = imageDataList[i];
                if ((current.width != first.width) ||
                    (current.height != first.height))
                    throw "all image data must have same size";
                croquis.addLayer();
                var context = croquis.getLayerCanvas(i).getContext("2d");
                context.putImageData(current, 0, 0);
            }
            croquis.selectLayer(0);
            croquis.unlockHistory();
        }
    }).call(null, self, imageDataList);
}
Croquis.createChecker = function (cellSize, colorA, colorB) {
    cellSize = (cellSize == null) ? 10 : cellSize;
    colorA = (colorA == null) ? "#fff" : colorA;
    colorB = (colorB == null) ? "#ccc" : colorB;
    var size = cellSize + cellSize;
    var checker = document.createElement("canvas");
    checker.width = checker.height = size;
    var context = checker.getContext("2d");
    context.fillStyle = colorB;
    context.fillRect(0, 0, size, size);
    context.fillStyle = colorA;
    context.fillRect(0, 0, cellSize, cellSize);
    context.fillRect(cellSize, cellSize, size, size);
    return checker;
};
//ブラシの形状のPointerを作成する
Croquis.createBrushPointer = function (brushImage, v_canvas, brushSize, brushAngle, threshold, antialias) {
    brushSize = brushSize | 0;
    var pointer = document.createElement("canvas");
    var pointerContext = pointer.getContext("2d");
    if (brushSize == 0) {
        pointer.width = 1;
        pointer.height = 1;
        return pointer;
    }
    if (brushImage == null) {
        var halfSize = (brushSize * 0.5) | 0;
        pointer.width = brushSize;
        pointer.height = brushSize;
        pointerContext.fillStyle = "#000";
        pointerContext.beginPath();
        pointerContext.arc(halfSize, halfSize, halfSize, 0, Math.PI * 2);
        pointerContext.closePath();
        pointerContext.fill();
    }
    else {
        var width = brushSize;
        var height = brushSize * (brushImage.height / brushImage.width);
        pointer.width = width;
        pointer.height = height;

        // const degree = brushAngle * Math.PI / 180;
        // console.log("angle:", brushAngle);
        // console.log("deg:", degree);
        //回転の中心を中央に移動
        //pointerContext.translate(50, 50);
        //pointerContext.rotate(degree);//追加
        // v_canvas.height = height;
        // v_canvas.width = width;
        // v_canvas.ctx.translate(width/2, height/2);
        // v_canvas.ctx.rotate(degree);//追加
        // v_canvas.ctx.drawImage(brushImage, 0, 0, width, height);

        pointerContext.drawImage(brushImage, 0, 0, width, height);
        //pointerContext.drawImage(v_canvas, 0, 0, width, height);
    }
    return Croquis.createAlphaThresholdBorder(pointer, threshold, antialias);
};
//ブラシの形状のPointerの輪郭を作成する
Croquis.createAlphaThresholdBorder = function (image, threshold,
                                               antialias, color) {
    threshold = (threshold == null) ? 0x80 : threshold;
    color = (color == null) ? "#000" : color;
    var width = image.width;
    var height = image.height;
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    try {
        context.drawImage(image, 0, 0, width, height);
    }
    catch (e) {
        return canvas;
    }
    var imageData = context.getImageData(0, 0, width, height);
    var d = imageData.data;
    function getAlphaIndex(index) {
        return d[index * 4 + 3];
    }
    function setRedIndex(index, red) {
        d[index * 4] = red;
    }
    function getRedXY(x, y) {
        var red = d[((y * width) + x) * 4];
        return red ? red : 0;
    }
    function getGreenXY(x, y) {
        var green = d[((y * width) + x) * 4 + 1];
        return green;
    }
    function setColorXY(x, y, red, green, alpha) {
        var i = ((y * width) + x) * 4;
        d[i] = red;
        d[i + 1] = green;
        d[i + 2] = 0;
        d[i + 3] = alpha;
    }
    //threshold
    var pixelCount = (d.length * 0.25) | 0;
    for (var i = 0; i < pixelCount; ++i)
        setRedIndex(i, (getAlphaIndex(i) < threshold) ? 0 : 1);
    //outline
    var x;
    var y;
    for (x = 0; x < width; ++x) {
        for (y = 0; y < height; ++y) {
            if (!getRedXY(x, y)) {
                setColorXY(x, y, 0, 0, 0);
            }
            else {
                var redCount = 0;
                var left = x - 1;
                var right = x + 1;
                var up = y - 1;
                var down = y + 1;
                redCount += getRedXY(left, up);
                redCount += getRedXY(left, y);
                redCount += getRedXY(left, down);
                redCount += getRedXY(right, up);
                redCount += getRedXY(right, y);
                redCount += getRedXY(right, down);
                redCount += getRedXY(x, up);
                redCount += getRedXY(x, down);
                if (redCount != 8)
                    setColorXY(x, y, 1, 1, 255);
                else
                    setColorXY(x, y, 1, 0, 0);
            }
        }
    }
    //antialias
    if (antialias) {
        for (x = 0; x < width; ++x) {
            for (y = 0; y < height; ++y) {
                if (getGreenXY(x, y)) {
                    var alpha = 0;
                    if (getGreenXY(x - 1, y) != getGreenXY(x + 1, y))
                        setColorXY(x, y, 1, 1, alpha += 0x40);
                    if (getGreenXY(x, y - 1) != getGreenXY(x, y + 1))
                        setColorXY(x, y, 1, 1, alpha + 0x50);
                }
            }
        }
    }
    context.putImageData(imageData, 0, 0);
    context.globalCompositeOperation = "source-in";
    context.fillStyle = color;
    context.fillRect(0, 0, width, height);
    return canvas;
};
//
Croquis.createFloodFill = function (canvas, x, y, r, g, b, a) {
    var result = document.createElement("canvas");
    var w = result.width = canvas.width;
    var h = result.height = canvas.height;
    if ((x < 0) || (x >= w) || (y < 0) || (y >= h) || !(r || g || b || a))
        return result;
    var originalContext = canvas.getContext("2d");
    var originalData = originalContext.getImageData(0, 0, w, h);
    var od = originalData.data;
    var resultContext = result.getContext("2d");
    var resultData = resultContext.getImageData(0, 0, w, h);
    var rd = resultData.data;
    var targetColor = getColor(x, y);
    var replacementColor = (r << 24) | (g << 16) | (b << 8) | a;
    function getColor(x, y) {
        var index = ((y * w) + x) * 4;
        return (rd[index] ? replacementColor :
            ((od[index] << 24) | (od[index + 1] << 16) |
             (od[index + 2] << 8) | od[index + 3]));
    }
    var queue = [];
    queue.push(x, y);
    while (queue.length) {
        var nx = queue.shift();
        var ny = queue.shift();
        if ((nx < 0) || (nx >= w) || (ny < 0) || (ny >= h) ||
            (getColor(nx, ny) !== targetColor))
            continue;
        var west, east;
        west = east = nx;
        do {
            var wc = getColor(--west, ny);
        } while ((west >= 0) && (wc === targetColor));
        do {
            var ec = getColor(++east, ny);
        } while ((east < w) && (ec === targetColor));
        for (var i = west + 1; i < east; ++i) {
            rd[((ny * w) + i) * 4] = 1;
            var north = ny - 1;
            var south = ny + 1;
            if (getColor(i, north) === targetColor)
                queue.push(i, north);
            if (getColor(i, south) === targetColor)
                queue.push(i, south);
        }
    }
    for (var i = 0; i < w; ++i) {
        for (var j = 0; j < h; ++j) {
            var index = ((j * w) + i) * 4;
            if (rd[index] == 0)
                continue;
            rd[index] = r;
            rd[index + 1] = g;
            rd[index + 2] = b;
            rd[index + 3] = a;
        }
    }
    resultContext.putImageData(resultData, 0, 0);
    return result;
};

Croquis.Tablet = {};
Croquis.Tablet.plugin = function () {
    var plugin = document.querySelector(
        "object[type=\"application/x-wacomtabletplugin\"]");
    if (!plugin) {
        plugin = document.createElement("object");
        plugin.type = "application/x-wacomtabletplugin";
        plugin.style.position = "absolute";
        plugin.style.top = "-1000px";
        document.body.appendChild(plugin);
    }
    return plugin;
};
Croquis.Tablet.pen = function () {
    var plugin = Croquis.Tablet.plugin();
    return plugin.penAPI;
};
Croquis.Tablet.pressure = function () {
    var pen = Croquis.Tablet.pen();
    return (pen && pen.pointerType) ? pen.pressure : 1;
};
Croquis.Tablet.isEraser = function () {
    var pen = Croquis.Tablet.pen();
    return pen ? pen.isEraser : false;
};

Croquis.Stabilizer = function (down, move, up, level, weight,
                               x, y, pressure, interval) {
    interval = interval || 5;
    var follow = 1 - Math.min(0.95, Math.max(0, weight));
    var paramTable = [];
    var current = { x: x, y: y, pressure: pressure };
    for (var i = 0; i < level; ++i)
        paramTable.push({ x: x, y: y, pressure: pressure });
    var first = paramTable[0];
    var last = paramTable[paramTable.length - 1];
    var upCalled = false;
    if (down != null)
        down(x, y, pressure);
    window.setTimeout(_move, interval);
    this.getParamTable = function () { //for test
        return paramTable;
    };
    this.move = function (x, y, pressure) {
        current.x = x;
        current.y = y;
        current.pressure = pressure;
    };
    this.up = function (x, y, pressure) {
        current.x = x;
        current.y = y;
        current.pressure = pressure;
        upCalled = true;
    };
    function dlerp(a, d, t) {
        return a + d * t;
    }
    function _move(justCalc) {
        var curr;
        var prev;
        var dx;
        var dy;
        var dp;
        var delta = 0;
        first.x = current.x;
        first.y = current.y;
        first.pressure = current.pressure;
        for (var i = 1; i < paramTable.length; ++i) {
            curr = paramTable[i];
            prev = paramTable[i - 1];
            dx = prev.x - curr.x;
            dy = prev.y - curr.y;
            dp = prev.pressure - curr.pressure;
            delta += Math.abs(dx);
            delta += Math.abs(dy);
            curr.x = dlerp(curr.x, dx, follow);
            curr.y = dlerp(curr.y, dy, follow);
            curr.pressure = dlerp(curr.pressure, dp, follow);
        }
        if (justCalc)
            return delta;
        if (upCalled) {
            while(delta > 1) {
                move(last.x, last.y, last.pressure);
                delta = _move(true);
            }
            up(last.x, last.y, last.pressure);
        }
        else {
            move(last.x, last.y, last.pressure);
            window.setTimeout(_move, interval);
        }

    }
};

Croquis.Brush = function () {
    var context;
    this.clone = function () {
        var clone = new Brush(context);
        clone.setColor(this.getColor());
        clone.setFlow(this.getFlow());
        clone.setSize(this.getSize());
        clone.setSpacing(this.getSpacing());
        clone.setImage(this.getImage());
    };
    this.getContext = function () {
        return context;
    };
    this.setContext = function (value) {
        context = value;
    };
    var color = "#000";
    this.getColor = function () {
        return color;
    };
    this.setColor = function (value) {
        color = value;
        transformedImageIsDirty = true;
    };
    var flow = 1;
    this.getFlow = function() {
        return flow;
    };
    this.setFlow = function(value) {
        flow = value;
        transformedImageIsDirty = true;
    };
    var size = 10;
    this.getSize = function () {
        return size;
    };
    this.setSize = function (value) {
        size = (value < 1) ? 1 : value;
        transformedImageIsDirty = true;
    };
    var spacing = 0.05;
    this.getSpacing = function () {
        return spacing;
    };
    this.setSpacing = function (value) {
        spacing = (value < 0.01) ? 0.01 : value;
    };
    //Angle追加
    var angle = 0;
    this.getAngle =function () {
        return angle;
    };
    this.setAngle = function (value) {
        angle = (value < 0) ? 0 : value;
    };
    //Minimum（最小サイズ）
    var minimum_size = 0;
    this.getMinimumSize =function () {
        return minimum_size;
    };
    this.setMinimumSize = function (value) {
        minimum_size = (value < 0.01) ? 0.01 : value;
    };
    //Device
    var userDevice = "pc";
    this.getUserDevice = function () {
        return userDevice;
    };
    this.setUserDevice = function (device) {
        userDevice = device;
    };
    //指ツールの場合
    var is_finger = false;
    this.getIsFinger = function () {
        return is_finger;
    }
    this.setIsFinger = function (finger) {
        is_finger = finger;
    };
    //Merge（混色）追加
    var isMerge = true;
    var merge = 0.2;
    this.getMerge = function () {
        return merge;
    }
    this.setMerge = function (value) {
        if (value > 0){
          isMerge = true;
          merge = value
        }
        else {
          isMerge = false;
          merge = 0;
        }
    }
    var image = null;
    var transformedImage = null;
    var transformedImageIsDirty = true;
    var imageRatio = 1;
    this.getImage = function () {
        return image;
    };
    this.setImage = function (value) {
        if (value == null) {
            transformedImage = image = null;
            imageRatio = 1;
            drawFunction = drawCircle;
        }
        else if (value != image) {
            image = value;
            imageRatio = image.height / image.width;
            transformedImage = document.createElement("canvas");
            drawFunction = drawImage;
            transformedImageIsDirty = true;
        }
    };
    var delta = 0;
    var prevX = 0;
    var prevY = 0;
    var lastX = 0;
    var lastY = 0;
    var prevScale = 0;
    var drawFunction = drawCircle;
    var dirtyRect;
    function appendDirtyRect(x, y, width, height) {
        if (!(width && height))
            return;
        var dxw = dirtyRect.x + dirtyRect.width;
        var dyh = dirtyRect.y + dirtyRect.height;
        var xw = x + width;
        var yh = y + height;
        var minX = dirtyRect.width ? Math.min(dirtyRect.x, x) : x;
        var minY = dirtyRect.height ? Math.min(dirtyRect.y, y) : y;
        dirtyRect.x = minX;
        dirtyRect.y = minY;
        dirtyRect.width = Math.max(dxw, xw) - minX;
        dirtyRect.height = Math.max(dyh, yh) - minY;
    }
    function hexToRGB(hex, alpha) {//cv:#565656 => [r, g, b, a]
      alpha = ratioTo255(alpha);
      if (alpha===0){
        return [255, 255, 255, alpha]
      }
      const r = parseInt(hex.slice(1, 3), 16)? parseInt(hex.slice(1, 3), 16): 0;
      const g = parseInt(hex.slice(3, 5), 16)? parseInt(hex.slice(3, 5), 16): 0;
      const b = parseInt(hex.slice(5, 7), 16)? parseInt(hex.slice(5, 7), 16): 0;
      if (alpha){
        return [r, g, b, alpha]
      }
      else {
        return [r, g, b, 255]
      }
    }
    function RgbaToRGB(rgba) {//rgba(0, 0, 0, 1) => [r, g, b, a]
      const s = rgba.split("(")[1];
      const d = s.split(',');
      return [
        parseInt(d[0]),
        parseInt(d[1]),
        parseInt(d[2]),
        parseInt(d[3]),
      ]
    }
    //色を混ぜる
    function mergeBrushColor(base, get_added, merge) {//下地hex　ペイントhex
      let merge_ratio = merge + (merge*prevScale);
      merge_ratio = (merge_ratio<1)? merge_ratio: 1;
      const added = hexToRGB(get_added, 1);
        var mix = [];
        const ba = base[3] * (merge_ratio)
        const [adr, br] = calRatio(added[3], ba);
        mix[0] = parseInt(adr*added[0]) + parseInt(base[0]*br);
        mix[1] = parseInt(added[1]*adr) + parseInt(base[1]*br);
        mix[2] = parseInt(added[2]*adr) + parseInt(base[2]*br);
        mix[3] = (adr) + (br);
        const merge_color = "rgba("+mix.join(',')+")";
        return merge_color;
    }
    //比率を255スケーリングする
    function ratioTo255(ratio) {
      return parseInt(ratio*255);
    }
    function c255ToRatio(data) {
      return data/255;
    }
    function calRatio(a, b) {
      if (a === 0){return [0, 1]}
      else if (b === 0){return [1, 0]}
      else {
        return [a/(a+b), b/(a+b)];
      }
    }
    //色をスポイトする(一点)
    function getDripperColor(_x, _y) {
      try {
        const imagedata = getNowLayerContext().getImageData(_x, _y, 1, 1);
        // RGBの取得
        const r = imagedata.data[0];
        const g = imagedata.data[1];
        const b = imagedata.data[2];
        const a = imagedata.data[3];
        if (a === 0) {
          return [255, 255, 255, 0];
        }
        return [r, g, b, a];
      }catch (e) {
        return [255, 255, 255, 0];
      }
    }
    // 平均値の計算
    function calcAve(data) {
        return (calcSum(data) / data.length);
    }
    //領域の色の平均値を取得する
    function getRectAveColor(_x, _y, size) {
      let w = parseInt(size / 1.41421356);
      let c = w / 2;
      let _x_c = (_x-c < 0)? 0: _x-c;
      let _y_c = (_y-c < 0)? 0: _y-c;
      w = (w+_x_c > width)? width-_x_c: w;
      const h = (w+_y_c > height)? height-_y_c: w;
      try {
        if (w < 1 || c < 1 || w < 1){
          return getDripperColor(_x, _y);
        }
        const imageData = getNowLayerContext().getImageData(_x_c, _y_c, w, h);
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
          } else {//透明度０の場合、白として扱う
            r.push(255);
            g.push(255);
            b.push(255);
            a.push(0);
          }
        }
        const r_ave = parseInt(calcAve(r));
        const g_ave = parseInt(calcAve(g));
        const b_ave = parseInt(calcAve(b));
        const a_ave = parseInt(calcAve(a));
        const rgb = 'rgb(' + r_ave + ',' + g_ave + ',' + b_ave + ')';
        return [r_ave, g_ave, b_ave, a_ave];
      }catch (e) {
        return [255, 255, 255, 0]
      }
    }
    //ぼかした色を作る
    function getRadGradColor(ctx, color, psize) {
        const x = psize/2;
        const y = psize/2;
        let radgrad = ctx.createRadialGradient(x, y, 0, x, y, psize);
        const rgb = RgbaToRGB(color);
        const rgb1 = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + 0.2 + ')';
        const rgb2 = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0)';
        radgrad.addColorStop(0, color);
        radgrad.addColorStop(0.6, rgb1);
        radgrad.addColorStop(1, rgb2);
        ctx.fillStyle = radgrad;
    }
    //ブラシのテクスチャを設定
    function transformImage() {
        transformedImage.width = size;
        transformedImage.height = size * imageRatio;
        var brushContext = transformedImage.getContext("2d");
        brushContext.clearRect(0, 0,
            transformedImage.width, transformedImage.height);
        brushContext.drawImage(image, 0, 0,
            transformedImage.width, transformedImage.height);
        brushContext.globalCompositeOperation = "source-in";

        //brushContext.fillStyle = color;
        const base_color = getRectAveColor(lastX, lastY, size);
        const merge_color = mergeBrushColor(base_color, color, merge);
        getRadGradColor(brushContext, merge_color, size);

        brushContext.globalAlpha = flow;
        brushContext.fillRect(0, 0,
            transformedImage.width, transformedImage.height);
    }
    function drawCircle(size) {
        if (is_finger){
          drawFinger(size);
        }
        else {
          var halfSize = size * 0.5;
          //追加
          const base_color = getRectAveColor(lastX, lastY, size);
          const merge_color = mergeBrushColor(base_color, color, merge);
          getRadGradColor(context, merge_color, size);

          context.globalAlpha = flow;
          context.beginPath();
          context.arc(halfSize, halfSize, halfSize, 0, Math.PI * 2);
          context.closePath();
          context.fill();
        }
    }
    function drawImage(size) {
      if (is_finger){
        drawFinger(size);
      }
      else {
        if (transformedImageIsDirty)
          transformImage();
        try {
          context.drawImage(transformedImage, 0, 0, size, size * imageRatio);
        } catch (e) {
          drawCircle(size);
        }
      }
    }
    //追加：指ツール
    function drawFinger(size) {
        var halfSize = size * 0.5;
        const base_color = getRectAveColor(lastX, lastY, size);//[255,255,255,255]
        const finger_color = 'rgba(' + base_color[0] + ',' + base_color[1] + ',' + base_color[2] + ',' + c255ToRatio(base_color[3]) + ')';
        getRadGradColor(context, finger_color, size);
        context.globalAlpha = flow;
        context.beginPath();
        context.arc(halfSize, halfSize, halfSize, 0, Math.PI * 2);
        context.closePath();
        context.fill();
    }
    function drawTo(x, y, size) {
        var halfSize = size * 0.5;
        var left = x - halfSize;
        var top = y - halfSize * imageRatio;
        context.save();
        context.translate(left, top);
        drawFunction(size);
        context.restore();
        appendDirtyRect(left, top, size, size * imageRatio);
    }
    this.down = function(x, y, scale) {
        if (context == null)
            throw "brush needs the context";
        dirtyRect = {x: 0, y: 0, width: 0, height: 0};
        if (scale > 0){
          const s = (scale < minimum_size)? minimum_size: scale;
          drawTo(x, y, size * s);
        }
        delta = 0;
        lastX = prevX = x;
        lastY = prevY = y;
        prevScale = scale;
    };
    this.move = function(x, y, scale) {
        if (context == null)
            throw "brush needs the context";
        if (scale > 0) {
            var dx = x - prevX;
            var dy = y - prevY;
            var ds = scale - prevScale;
            var d = Math.sqrt(dx * dx + dy * dy);
            prevX = x;
            prevY = y;
            delta += d;
            var midScale = (prevScale + scale) * 0.5;
            var drawSpacing = size * spacing * midScale;
            if (drawSpacing < 0.5) //not correct, but performance
                drawSpacing = 0.5;
            if (delta < drawSpacing) { //no need to draw
                prevScale = scale;
                return;
            }
            context.save();
            var scaleSpacing = ds * (drawSpacing / delta);
            var ldx = x - lastX;
            var ldy = y - lastY;
            var ld = Math.sqrt(ldx * ldx + ldy * ldy);
            if (ld < drawSpacing) {
                lastX = x;
                lastY = y;
                prevScale = scale;
                const s = (prevScale < minimum_size)? minimum_size: prevScale;
                drawTo(lastX, lastY, size * s);
                delta -= drawSpacing;
            } else {
                while(delta >= drawSpacing) {
                    ldx = x - lastX;
                    ldy = y - lastY;
                    var dir = Math.atan2(ldy, ldx);
                    var tx = Math.cos(dir);
                    var ty = Math.sin(dir);
                    lastX += tx * drawSpacing;
                    lastY += ty * drawSpacing;
                    prevScale += scaleSpacing;
                    const s = (prevScale < minimum_size)? minimum_size: prevScale;
                    drawTo(lastX, lastY, size * s);
                    delta -= drawSpacing;
                }
            }
            prevScale = scale;
            context.restore();
        }
        else {
            delta = 0;
            prevX = x;
            prevY = y;
            prevScale = scale;
        }
    };
    this.up = function (x, y, scale) {
        return dirtyRect;
    }
};

var app = (function () {

    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }

    var stompClient = null;
    // PartIII
    var currentDrawingId = null;

    var addPointToCanvas = function (point) {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);

        // PartIII
        ctx.fillStyle = "#FF0000";
        ctx.fill();
        ctx.stroke();
    };

    // PartIV
    var drawPolygon = function (polygon) {
        console.log('Drawing polygon with points:', polygon.points);

        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");

        if (polygon.points && polygon.points.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = "#2730b1ff";
            ctx.fillStyle = "rgba(68, 142, 190, 0.66)";
            ctx.lineWidth = 2;

            ctx.moveTo(polygon.points[0].x, polygon.points[0].y);

            for (var i = 1; i < polygon.points.length; i++) {
                ctx.lineTo(polygon.points[i].x, polygon.points[i].y);
            }

            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            console.log('Polygon drawn');
        }
    };

    var getMousePosition = function (evt) {
        canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    var updateStatus = function(connected) {
        var statusEl = document.getElementById('status');
        if (connected) {
            statusEl.className = 'status connected';
            statusEl.textContent = 'Connected to Room ' + currentDrawingId;
        } else {
            statusEl.className = 'status disconnected';
            statusEl.textContent = 'Disconnected';
        }
    };

    var connectAndSubscribe = function () {

        var drawingIdInput = document.getElementById("drawingId").value;

        // PartIII
        if (!drawingIdInput) {
            alert("Please enter a drawing number!");
            return;
        }

        currentDrawingId = drawingIdInput;

        console.info('Connecting to WS...' + currentDrawingId);
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);

        //subscribe to /topic/TOPICXX when connections succeed
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);

            // PartIII
            var topicPoints = '/topic/newpoint.' + currentDrawingId;
            var topicPolygon = '/topic/newpolygon.' + currentDrawingId;
            //Part I - 2.
            stompClient.subscribe(topicPoints, function (eventbody) {
                console.log('Message received' + topicPoints, eventbody);

                var theObject = JSON.parse(eventbody.body);


                // alert('Punto recibido: X=' + theObject.x + ', Y=' + theObject.y);
                //Part II - 1.
                addPointToCanvas(theObject);
            });

            stompClient.subscribe(topicPolygon, function (eventbody) {
                console.log('Polygon received from ' + topicPolygon, eventbody);
                var polygon = JSON.parse(eventbody.body);
                console.log('Parsed polygon:', polygon);
                drawPolygon(polygon);
            });
        });

    };



    return {

        init: function () {
            var can = document.getElementById("canvas");

            //websocket connection

            canvas.addEventListener("click", function(evt) {
                if (currentDrawingId === null) {
                    alert('connect to a room first');
                    return;
                }
                
                var mousePos = getMousePosition(evt);
                console.log("Mouse clicked at:", mousePos);
                app.publishPoint(mousePos.x, mousePos.y);
            });

        },

        connectAndSubscribe: connectAndSubscribe,

        publishPoint: function (px, py) {
            if (currentDrawingId === null) {
                alert('Please connect to a drawing first!');
                return;
            }

            var pt = new Point(parseInt(px), parseInt(py));
            console.info("publishing point at " + pt);
            // addPointToCanvas(pt);

            //publicar el evento

            //PartIII
            // var topic = '/topic/newpoint.' + currentDrawingId;

            //Part I - 1.
            // stompClient.send(topic, {}, JSON.stringify(pt)); 

            if (stompClient !== null && stompClient.connected) {
                var topic = '/app/newpoint.' + currentDrawingId;
                console.log('Sending point to ' + topic + ':', JSON.stringify(pt));
                stompClient.send(topic, {}, JSON.stringify(pt));
            } else {
                console.error('STOMP client not connected yet!');
                alert('Please wait a moment for the connection');
            }
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            setConnected(false);
            console.log("Disconnected");
        }
    };

})();
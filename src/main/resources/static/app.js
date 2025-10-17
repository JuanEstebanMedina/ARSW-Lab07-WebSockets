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

    var getMousePosition = function (evt) {
        canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
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
            var topic = '/topic/newpoint.' + currentDrawingId;
            //Part I - 2.
            stompClient.subscribe(topic, function (eventbody) {
                console.log('Message received' + topic, eventbody);

                var theObject = JSON.parse(eventbody.body);

                
                // alert('Punto recibido: X=' + theObject.x + ', Y=' + theObject.y);
                //Part II - 1.
                addPointToCanvas(theObject);
            });

            console.log('Subscription complete to ' + topic);
            alert('Connected to drawing ' + currentDrawingId + '!');
        });

    };



    return {

        init: function () {
            var can = document.getElementById("canvas");

            //websocket connection
            
        },

        connectAndSubscribe: connectAndSubscribe,

        publishPoint: function (px, py) {
            var pt = new Point(parseInt(px), parseInt(py));
            console.info("publishing point at " + pt);
            // addPointToCanvas(pt);

            //publicar el evento

            //PartIII
            var topic = '/topic/newpoint.' + currentDrawingId;

            //Part I - 1.
            stompClient.send(topic, {}, JSON.stringify(pt)); 

            // if (stompClient !== null && stompClient.connected) {
            //     stompClient.send("/topic/newpoint", {}, JSON.stringify(pt));
            //     console.log('Point sent!');
            // } else {
            //     console.error('STOMP client not connected yet!');
            //     alert('Please wait a moment for the connection to establish.');
            // }
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
var app = (function () {

    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }

    var stompClient = null;

    var addPointToCanvas = function (point) {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI);
        ctx.stroke();
    };

    // var addPointToCanvas = function (point) {
    //     console.log('addPointToCanvas called with:', point);
    //     console.log('point.x =', point.x, 'typeof:', typeof point.x);
    //     console.log('point.y =', point.y, 'typeof:', typeof point.y);

    //     var canvas = document.getElementById("canvas");
    //     console.log('Canvas element:', canvas);

    //     var ctx = canvas.getContext("2d");
    //     console.log('Canvas context:', ctx);

    //     ctx.beginPath();
    //     ctx.arc(point.x, point.y, 50, 0, 2 * Math.PI);
    //     ctx.stroke();

    //     console.log('Point drawn!');
    // };

    var getMousePosition = function (evt) {
        canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };


    var connectAndSubscribe = function () {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);

        //subscribe to /topic/TOPICXX when connections succeed
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            //Part I - 2.
            stompClient.subscribe('/topic/newpoint', function (eventbody) {
                console.log('Message received', eventbody);

                var theObject = JSON.parse(eventbody.body);
                // alert('Punto recibido: X=' + theObject.x + ', Y=' + theObject.y);
                //Part II - 1.
                addPointToCanvas(theObject);
            });
        });

    };



    return {

        init: function () {
            var can = document.getElementById("canvas");

            //websocket connection
            connectAndSubscribe();
        },

        publishPoint: function (px, py) {
            var pt = new Point(parseInt(px), parseInt(py));
            console.info("publishing point at " + pt);
            // addPointToCanvas(pt);

            //publicar el evento

            //Part I - 1.
            stompClient.send("/topic/newpoint", {}, JSON.stringify(pt)); 

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
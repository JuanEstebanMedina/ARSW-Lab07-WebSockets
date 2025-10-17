# ARSW-Lab07 - WebSockets

**Escuela Colombiana de Ingeniería Julio Garavito**  
**Arquitecturas de Software - ARSW**  
**Laboratorio Número 7 - WebSockets**

**Miembros:**
- Juan Esteban Medina Rivas
- María Paula Sánchez Macías

---

## Descripción

Este laboratorio implementa una herramienta de dibujo colaborativo Web basada en WebSockets con protocolo STOMP. La aplicación permite que múltiples usuarios dibujen puntos en un canvas compartido en tiempo real y crea polígonos automáticamente cuando se completan 4 puntos.

---

## Arquitectura

El sistema está configurado como un Broker de mensajes donde:
- El manejador de mensajes está asociado a `/app`
- El broker está configurado en `/topic`
- Se utilizan tópicos dinámicos para manejar múltiples dibujos simultáneos: `/topic/newpoint.{numdibujo}` y `/topic/newpolygon.{numdibujo}`

### Componentes principales:

**Cliente (JavaScript/HTML5):**
- Captura eventos de mouse en el canvas
- Publica puntos en `/app/newpoint.{numdibujo}`
- Se suscribe a `/topic/newpoint.{numdibujo}` para recibir puntos
- Se suscribe a `/topic/newpolygon.{numdibujo}` para recibir polígonos

**Servidor (Spring Boot):**
- Intercepta mensajes en `/app/newpoint.{numdibujo}`
- Almacena puntos en `ConcurrentHashMap` (thread-safe)
- Propaga puntos inmediatamente a `/topic/newpoint.{numdibujo}`
- Detecta cuando hay 4+ puntos y publica polígono en `/topic/newpolygon.{numdibujo}`

---

## Estructura del Proyecto

```
ARSW-Lab07-WebSockets/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── edu/eci/arsw/collabpaint/
│   │   │       ├── CollabPaintApplication.java
│   │   │       ├── CollabPaintWebSocketConfig.java
│   │   │       ├── STOMPMessagesHandler.java
│   │   │       └── model/
│   │   │           ├── Point.java
│   │   │           └── Polygon.java
│   │   └── resources/
│   │       └── static/
│   │           ├── index.html
│   │           ├── app.js
│   │           └── styles.css
└── pom.xml
```
---

## Instalación y Ejecución

1. Clonar el repositorio:
```bash
git clone https://github.com/JuanEstebanMedina/ARSW-Lab07-WebSockets/tree/develop
cd ARSW-Lab07-WebSockets
```

2. Compilar el proyecto:
```bash
mvn clean install
```

3. Ejecutar la aplicación:
```bash
mvn spring-boot:run
```

4. Acceder en el navegador:
```
http://localhost:8080
```

---

## Parte I - Propagación Básica de Puntos

**Objetivo:** Implementar la publicación y suscripción de puntos a través de WebSocket para que se propaguen entre todas las instancias abiertas.

1. Haga que la aplicación HTML5/JS al ingresarle en los campos de X y Y, además de graficarlos, los publique en el tópico: /topic/newpoint . Para esto tenga en cuenta (1) usar el cliente STOMP creado en el módulo de JavaScript y (2) enviar la representación textual del objeto JSON (usar JSON.stringify).

```javascript
stompClient.send("/topic/newpoint", {}, JSON.stringify(pt));
```

2. **Modificamos la función de suscripción** para que la aplicación se suscriba al tópico `/topic/newpoint` en lugar del tópico `/TOPICOXX`. Asociamos como callback una función que extrae el contenido del evento, lo convierte en objeto JSON y muestra una alerta con las coordenadas:

```javascript
stompClient.subscribe('/topic/newpoint', function (eventbody) {
    var theObject = JSON.parse(eventbody.body);
    alert('Punto recibido: X=' + theObject.x + ', Y=' + theObject.y);
});
```

3. **Compilamos y ejecutamos** la aplicación. Abrimos varias pestañas diferentes (en modo incógnito para evitar problemas de caché).

4. **Pruebas**

![](https://github.com/JuanEstebanMedina/ARSW-Lab07-WebSockets/blob/develop/img/PartI%20pruebas.png)

![](https://github.com/JuanEstebanMedina/ARSW-Lab07-WebSockets/blob/develop/img/PartIPruebas2.png)

**Resultado:** Las alertas se muestran correctamente en todas las pestañas abiertas con las coordenadas enviadas.

---

## Parte II - Dibujo con Eventos de Mouse

**Objetivo:** Capturar coordenadas mediante clics en el canvas y dibujar los puntos recibidos en lugar de mostrar alertas.

1. **Modificamos el callback** asociado al tópico `/topic/newpoint` para que en lugar de mostrar una alerta, dibuje un punto en el canvas en las coordenadas enviadas:

```javascript
stompClient.subscribe('/topic/newpoint', function (eventbody) {
    var theObject = JSON.parse(eventbody.body);
    addPointToCanvas(theObject);
});
```

2. **Implementamos la función para dibujar puntos** en el canvas como círculos de radio 3:

```javascript
var addPointToCanvas = function (point) {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = "#FF0000";
    ctx.fill();
    ctx.stroke();
};
```

3. **Agregamos captura de eventos de mouse** en el canvas para detectar clics y enviar las coordenadas automáticamente:

```javascript
canvas.addEventListener("click", function(evt) {
    var mousePos = getMousePosition(evt);
    app.publishPoint(mousePos.x, mousePos.y);
});
```

4. **Ejecutamos** la aplicación en varios navegadores. Comprobamos que a medida que se dibuja un punto (haciendo clic en el canvas), el mismo es replicado en todas las instancias abiertas.

![](https://github.com/JuanEstebanMedina/ARSW-Lab07-WebSockets/blob/develop/img/PartII-1-Pruebas.png)

![](https://github.com/JuanEstebanMedina/ARSW-Lab07-WebSockets/blob/develop/img/PartII-1-Pruebas2.png)

![](https://github.com/JuanEstebanMedina/ARSW-Lab07-WebSockets/blob/develop/img/PartII-1-Pruebas3.png)

![](https://github.com/JuanEstebanMedina/ARSW-Lab07-WebSockets/blob/develop/img/PartII-1-Pruebas4.png)

**Resultado:** Los puntos se dibujan correctamente en el canvas y se replican en todas las pestañas en tiempo real.

---

## Parte III - Tópicos Dinámicos para Múltiples Dibujos

**Objetivo:** Permitir múltiples dibujos simultáneos e independientes mediante tópicos dinámicos.

1. **Agregamos un campo en la vista** para que el usuario pueda ingresar un número que corresponde al identificador del dibujo:

```html
Drawing Number: <input id="drawingId" type="number" placeholder="Room #"/>
<button onclick="app.connectAndSubscribe()">Connect</button>
```

2. **Modificamos la aplicación** para que en lugar de conectarse automáticamente en `init()`, lo haga a través del botón 'Connect'. Al presionarlo, realiza la conexión y suscribe al cliente a un tópico dinámico asociado al identificador ingresado:

```javascript
var connectAndSubscribe = function () {
    var drawingIdInput = document.getElementById("drawingId").value;
    currentDrawingId = drawingIdInput;
    
    var topic = '/topic/newpoint.' + currentDrawingId;
    stompClient.subscribe(topic, function (eventbody) {
        var theObject = JSON.parse(eventbody.body);
        addPointToCanvas(theObject);
    });
};
```

3. **Modificamos las publicaciones** para que se realicen al tópico asociado al identificador ingresado por el usuario:

```javascript
var topic = '/topic/newpoint.' + currentDrawingId;
stompClient.send(topic, {}, JSON.stringify(pt));
```

4. **Pruebas**

![](https://github.com/JuanEstebanMedina/ARSW-Lab07-WebSockets/blob/develop/img/PartIIIPruebas.png)

![](https://github.com/JuanEstebanMedina/ARSW-Lab07-WebSockets/blob/develop/img/PartIIIPruebas2.png)

![](https://github.com/JuanEstebanMedina/ARSW-Lab07-WebSockets/blob/develop/img/PartIIIPruebas3.png)

**Resultado:** Los dibujos funcionan de manera independiente según el número de sala.

---

## Parte IV - Polígonos Automáticos

**Objetivo:** Implementar un servidor que intercepte eventos, acumule puntos y cree polígonos automáticamente al completar 4 puntos.

### 1. Crear el Controlador STOMP

Creamos una clase `STOMPMessagesHandler` que intercepta mensajes enviados a `/app/newpoint.{numdibujo}`. A este controlador se le inyecta un bean `SimpMessagingTemplate` que permite publicar eventos en tópicos:

```java
@Controller
public class STOMPMessagesHandler {
    
    @Autowired
    SimpMessagingTemplate msgt;
    
    private ConcurrentHashMap<String, List<Point>> drawingPoints = new ConcurrentHashMap<>();
    
    @MessageMapping("/newpoint.{numdibujo}")    
    public void handlePointEvent(Point pt, @DestinationVariable String numdibujo) throws Exception {
        System.out.println("Nuevo punto recibido en el servidor!: " + pt);
        msgt.convertAndSend("/topic/newpoint." + numdibujo, pt);
    }
}
```

### 2. Ajustar el Cliente

Modificamos el cliente para que en lugar de publicar los puntos en `/topic/newpoint.{numdibujo}`, lo haga en `/app/newpoint.{numdibujo}`:

```javascript
var topic = '/app/newpoint.' + currentDrawingId;
stompClient.send(topic, {}, JSON.stringify(pt));
```

Ejecutamos nuevamente la aplicación y rectificamos que funciona igual, pero ahora mostrando en el servidor los detalles de los puntos recibidos.

**Consola del servidor:**
```
Nuevo punto recibido en el servidor!: Point{x=100, y=100}
Nuevo punto recibido en el servidor!: Point{x=200, y=100}
...
```

### 3. Implementar Acumulación de Puntos y Creación de Polígonos

Modificamos el manejador para llevar el control de los puntos recibidos. Cuando se completan 4 puntos, publica el polígono en `/topic/newpolygon.{numdibujo}`. Para manejar la concurrencia, usamos `ConcurrentHashMap` y sincronización:

```java
@MessageMapping("/newpoint.{numdibujo}")    
public void handlePointEvent(Point pt, @DestinationVariable String numdibujo) {
    System.out.println("Nuevo punto recibido: " + pt);
    
    // Propagar punto inmediatamente
    msgt.convertAndSend("/topic/newpoint." + numdibujo, pt);
    
    // Almacenar punto
    drawingPoints.putIfAbsent(numdibujo, new ArrayList<>());
    List points = drawingPoints.get(numdibujo);
    
    // Sincronizar para evitar race conditions
    synchronized (points) {
        points.add(pt);
        
        if (points.size() >= 4) {
            Polygon polygon = new Polygon(new ArrayList<>(points));
            System.out.println("¡Polígono completado!: " + polygon);
            msgt.convertAndSend("/topic/newpolygon." + numdibujo, polygon);
            points.clear();
        }
    }
}
```

Creamos la clase `Polygon`:

```java
public class Polygon {
    private List points;
    
    public Polygon() {
        this.points = new ArrayList<>();
    }
    
    public Polygon(List points) {
        this.points = points;
    }
    
    public List getPoints() {
        return points;
    }
    
    public void setPoints(List points) {
        this.points = points;
    }
}
```

### 4. Suscribir el Cliente a Polígonos

El cliente ahora también se suscribe al tópico `/topic/newpolygon.{numdibujo}`. El callback dibuja un polígono con los datos recibidos:

```javascript
var topicPolygon = '/topic/newpolygon.' + currentDrawingId;
stompClient.subscribe(topicPolygon, function (eventbody) {
    var polygon = JSON.parse(eventbody.body);
    drawPolygon(polygon);
});
```

Implementamos la función para dibujar polígonos:

```javascript
var drawPolygon = function (polygon) {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    
    if (polygon.points && polygon.points.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = "#667eea";
        ctx.fillStyle = "rgba(102, 126, 234, 0.3)";
        ctx.lineWidth = 3;
        
        ctx.moveTo(polygon.points[0].x, polygon.points[0].y);
        for (var i = 1; i < polygon.points.length; i++) {
            ctx.lineTo(polygon.points[i].x, polygon.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
};
```

### 5. Verificar la Funcionalidad

![](https://github.com/JuanEstebanMedina/ARSW-Lab07-WebSockets/blob/develop/img/PartIVprueba.png)

## Diagramas de Actividades

### Diagrama del Cliente (Paint Client)

![](https://github.com/JuanEstebanMedina/ARSW-Lab07-WebSockets/blob/develop/img/Diagrama2.jpg)

Muestra el flujo de actividades del cliente: conexión a sala, captura de clics, envío de puntos, recepción de puntos y polígonos, y dibujado en canvas.

### Diagrama del Servidor (Message Handler)

![](https://github.com/JuanEstebanMedina/ARSW-Lab07-WebSockets/blob/develop/img/Diagrama1.jpg)

Muestra el procesamiento en el servidor: recepción de puntos, broadcast a clientes, almacenamiento thread-safe, detección de polígono completo, y envío de polígonos.

---

## Criterios de Evaluación

✅ La aplicación propaga correctamente los puntos entre todas las instancias con un solo dibujo  
✅ La aplicación propaga correctamente los puntos con más de un dibujo simultáneo  
✅ La aplicación propaga correctamente el evento de creación del polígono al insertar 4 puntos  
✅ La aplicación maneja correctamente polígonos con 2 o más dibujos simultáneos  
✅ Se tuvo en cuenta la naturaleza concurrente usando colecciones thread-safe

---
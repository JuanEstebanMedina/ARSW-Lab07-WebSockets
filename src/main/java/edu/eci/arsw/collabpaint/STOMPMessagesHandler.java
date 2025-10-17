package edu.eci.arsw.collabpaint;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import edu.eci.arsw.collabpaint.model.Point;
import edu.eci.arsw.collabpaint.model.Polygon;

@Controller
public class STOMPMessagesHandler {
    
    @Autowired
    SimpMessagingTemplate msgt;

    private ConcurrentHashMap<String, List<Point>> drawingPoints = new ConcurrentHashMap<>();
    
    @MessageMapping("/newpoint.{numdibujo}")    
    public void handlePointEvent(Point pt, @DestinationVariable String numdibujo) throws Exception {
        System.out.println("Nuevo punto recibido en el servidor!: " + pt);
        msgt.convertAndSend("/topic/newpoint." + numdibujo, pt);

        drawingPoints.putIfAbsent(numdibujo, new ArrayList<>());
        
        List<Point> points = drawingPoints.get(numdibujo);
        
        synchronized (points) {
            points.add(pt);
            System.out.println("Total de puntos para dibujo " + numdibujo + ": " + points.size());
            
            if (points.size() >= 4) {
                Polygon polygon = new Polygon(new ArrayList<>(points));
                System.out.println("¡Polígono completado para dibujo " + numdibujo + "!: " + polygon);
                
                msgt.convertAndSend("/topic/newpolygon." + numdibujo, polygon);
                
                points.clear();
                System.out.println("Puntos limpiados para dibujo " + numdibujo);
            }
        }
    }
}
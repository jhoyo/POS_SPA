# Manual de Usuario — Sistema de Punto de Venta (POS Spa Facial)

Esta guía explica, paso a paso y sin tecnicismos, cómo usar el sistema para
**buscar productos**, **registrar una venta** y **consultar el corte de caja**.

No necesitas saber nada de computación para seguirla: solo ubica los botones y
casillas que se mencionan en cada paso.

---

## Antes de empezar

### Cómo iniciar sesión

1. Abre el sistema en tu navegador. Verás la pantalla de inicio con el título **"POS Spa Facial"**.
2. En la casilla **"Usuario"**, escribe tu nombre de usuario.
3. En la casilla **"PIN"**, escribe tu PIN numérico.
4. Haz clic en el botón azul **"Entrar"**.
5. Si tus datos son correctos, el sistema te llevará automáticamente a tu pantalla principal.

> ⚠️ **Si te equivocas de PIN 3 veces seguidas**, el sistema bloqueará tu cuenta
> temporalmente y verás el mensaje *"Cuenta bloqueada temporalmente"*. Espera
> unos minutos e inténtalo de nuevo, o pide ayuda a un administrador.

Arriba de la pantalla verás un menú con las secciones disponibles: **Ventas**,
**Productos**, **Inventario** y **Caja**. A la derecha aparece tu nombre y el
botón **"Cerrar sesión"**.

### Cómo abrir la caja (necesario antes de vender)

Antes de registrar tu primera venta del turno, el sistema te pedirá abrir la caja:

1. Ve a la sección **"Caja"** en el menú superior.
2. En la casilla **"Fondo inicial"**, escribe la cantidad de efectivo con la que
   empiezas tu turno (el dinero para dar cambio).
3. Haz clic en el botón **"Abrir caja"**.

Si el sistema te dice que ya hay una caja abierta de un turno anterior, pide a un
administrador que ingrese su PIN para autorizar la apertura.

---

## 1. Cómo buscar un producto

1. Ve a la sección **"Ventas"** en el menú superior.
2. Verás una casilla de texto que dice **"Buscar por nombre o escanear código de barras..."**.
3. Tienes dos formas de buscar:
   - **Escribiendo el nombre:** empieza a escribir el nombre del producto (por
     ejemplo, "masca..."). Aparecerá abajo una lista con los productos que
     coinciden, junto con cuántas unidades hay disponibles.
   - **Escaneando el código de barras:** con el foco en esa misma casilla, pasa
     el lector de código de barras sobre el producto. El sistema lo reconocerá
     automáticamente, sin que tengas que escribir nada.
4. Si el producto que buscas no aparece en la lista o el código escaneado no se
   reconoce, verás el mensaje **"Producto no encontrado. ¿Desea registrarlo?"**.
   Solo un administrador puede dar de alta productos nuevos.

> 💡 **Consejo:** si un producto muestra la etiqueta amarilla **"Stock bajo"** o
> el sistema te avisa **"Sin stock disponible"**, avisa a un administrador para
> que reponga el inventario.

---

## 2. Cómo registrar una venta

1. Ve a la sección **"Ventas"**.
2. **Busca y agrega los productos** que el cliente va a comprar (sigue los pasos
   de la sección anterior). Cada producto que selecciones aparecerá en una tabla
   debajo, con su cantidad, precio y total.
3. Si necesitas cambiar la cantidad de un producto, escribe el nuevo número en
   la columna **"Cant."** de esa fila.
4. Si el producto tiene una promoción o descuento autorizado, escribe el
   porcentaje en la columna **"Desc."**.
   - Si el descuento es mayor al permitido para cajeros, el sistema te pedirá
     el **PIN de un administrador** antes de continuar. Pídeselo y escríbelo
     en la ventana que aparece.
5. Revisa el **total** que se muestra abajo de la tabla; debe coincidir con lo
   que le vas a cobrar al cliente.
6. En el panel **"Cobro"** (a la derecha), elige la **forma de pago**: Efectivo,
   Tarjeta o Transferencia.
7. Escribe el **monto** que el cliente te está dando.
   - Si el cliente paga con dos métodos distintos (por ejemplo, parte en
     efectivo y parte con tarjeta), haz clic en **"+ Agregar otra forma de pago
     (pago mixto)"** y registra cada monto por separado.
8. Haz clic en el botón azul **"Confirmar pago"**.
   - Si el dinero recibido es menor al total, el sistema te avisará **"Monto
     insuficiente"** y te dirá cuánto falta. Corrige el monto y vuelve a
     intentarlo.
9. Al confirmar, el sistema mostrará el **ticket de la venta** con el folio, los
   productos, el total y el cambio a entregar. Entrégalo al cliente.
10. Para iniciar una venta nueva, haz clic en **"Nueva venta"**.

### Si necesitas cancelar una venta antes de cobrar

Si te equivocaste y quieres empezar de nuevo **antes de confirmar el pago**:

1. Haz clic en el botón **"Cancelar venta"** (debajo de la tabla de productos).
2. Confirma haciendo clic en **"Sí, cancelar"** en la ventana que aparece.
3. El carrito quedará vacío, listo para empezar una venta nueva.

---

## 3. Cómo consultar el corte de caja

El **corte de caja** te muestra cuánto se ha vendido en tu turno. Hay dos tipos:

- **Corte X**: es un vistazo rápido, se puede hacer las veces que quieras
  durante el turno y **no cierra la caja**.
- **Corte Z**: es el cierre **definitivo** del turno. Una vez hecho, no se puede
  deshacer ni volver a abrir esa caja.

### Consultar el corte X (revisar ventas sin cerrar)

1. Ve a la sección **"Caja"** en el menú superior.
2. Haz clic en el botón **"Corte X (parcial)"**.
3. El sistema mostrará un resumen con: el número de ventas realizadas, el total
   acumulado y cuánto corresponde a cada forma de pago (efectivo, tarjeta,
   transferencia). Este resumen dice claramente **"CORTE PARCIAL — NO CIERRA
   CAJA"**, así que puedes seguir vendiendo con normalidad después de verlo.

### Hacer el corte Z (cerrar la caja al final del turno)

1. Ve a la sección **"Caja"**.
2. Haz clic en el botón rojo **"Corte Z (cierre)"**.
3. Cuenta el efectivo físico que tienes en la caja.
4. Escribe esa cantidad en la casilla **"Efectivo contado"**.
5. Haz clic en **"Generar corte Z"**.
6. El sistema mostrará el resultado final: el fondo inicial, el efectivo que
   esperaba encontrar, lo que tú contaste, y la **diferencia** entre ambos:
   - Si la diferencia es **$0.00**, tu caja cuadró perfectamente.
   - Si es un número negativo, significa que **falta dinero**.
   - Si es un número positivo, significa que **sobra dinero**.

> ⚠️ **Importante:** una vez que generas el corte Z, la caja queda cerrada para
> siempre y no podrás registrar más ventas hasta que abras una nueva caja
> (repite los pasos de *"Cómo abrir la caja"* al inicio de este manual).
> Asegúrate de que ya no falten ventas por registrar antes de hacerlo.

---

## Preguntas frecuentes

**¿Qué hago si el sistema dice "Debe registrar el fondo para abrir una nueva caja"?**
Significa que no tienes una caja abierta. Ve a la sección *"Cómo abrir la caja"*
al inicio de este manual.

**¿Qué hago si me equivoco al escribir el PIN varias veces?**
Espera unos minutos a que se desbloquee tu cuenta automáticamente, o pide a un
administrador que revise tu usuario.

**¿Puedo reimprimir el ticket de una venta anterior?**
Sí, pide ayuda a un administrador o consulta la sección de historial de ventas
si tu usuario tiene acceso a ella.

**¿Qué hago si un producto no tiene suficiente stock?**
El sistema no te dejará agregarlo y mostrará *"Sin stock disponible"*. Avisa a
un administrador para que registre una entrada de mercancía.

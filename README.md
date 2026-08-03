# Academia Certifica

## Ver las interfaces YA (Windows)

1. Instalá Node.js LTS: https://nodejs.org/ → reiniciá la PC  
2. En la carpeta del proyecto, **doble clic** en:

### `start-local.bat`

3. Esperá hasta que diga servidor OK / localhost:3000  
4. Se abre el navegador solo. Si no:

```powershell
.\abrir-edge.bat
```

```
Admin: admin@academia.local
Clave:  Admin123!
```

**Importante:** no cierres la ventana negra. Si la cerrás, Edge muestra `ERR_CONNECTION_REFUSED`.

Si falla, abrí el archivo `start-local.log` y copiá el contenido.

## SQL Server

La UI local usa SQLite para que siempre arranque.  
SQL Server (`LARA-NB\SQLEXPRESS02` / `Cursosventas`) se conecta después; scripts en `sql/sqlserver/`.

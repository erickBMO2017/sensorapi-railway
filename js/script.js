       // Variables globales
        let requests = [];
        let reportData = [];
        let currentSensorData = null;
        let URL_Dinamica = "https://sensorapi-railway.up.railway.app/";

        // Inicialización al cargar la página
        document.addEventListener("DOMContentLoaded", function () {
            initializeEventListeners();
            toggleTableVisibility();
        });

        // Función para inicializar todos los event listeners
        function initializeEventListeners() {
            // Autenticación
            document.getElementById("username").addEventListener("input", toggleAuthButtons);
            document.getElementById("password").addEventListener("input", toggleAuthButtons);
            document.getElementById("showSensors").addEventListener("click", handleShowSensors);

            // Opciones de reporte
            document.querySelectorAll('input[name="option"]').forEach(radio => {
                radio.addEventListener("change", handleReportOptionChange);
            });

            // Tipo de operación
            document.getElementById("operationType").addEventListener("change", handleOperationTypeChange);

            // Manejo de archivos
            document.getElementById("fileInput").addEventListener("change", handleFileUpload);

            // Botones de acción
            document.getElementById("fetchData").addEventListener("click", handleFetchData);
            document.getElementById("generateReport").addEventListener("click", handleGenerateReport);
            document.getElementById("exportToExcel").addEventListener("click", handleExportToExcel);

            // Agregar evento al botón de selección de archivo
            document.querySelector('.file-input-btn').addEventListener('click', function () {
                // Forzar la apertura del selector de archivos
                document.getElementById('fileInput').click();
            });
        }

        // Función para habilitar/deshabilitar botones de autenticación
        function toggleAuthButtons() {
            const isValid = validateCredentials();
            document.getElementById("showSensors").disabled = !isValid;
        }

        // Función para validar credenciales
        function validateCredentials() {
            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value.trim();
            return username !== "" && password !== "";
        }

        // Función para manejar la visibilidad de la tabla
        function toggleTableVisibility() {
            const operationType = document.getElementById("operationType").value;
            const table = document.getElementById("dataTable");
            table.classList.toggle("d-none", operationType !== "sales");
        }

        // Función para manejar el cambio en las opciones de reporte
        function handleReportOptionChange() {
            const isDaily = document.getElementById("optionDay").checked;
            updateTableHeaders(isDaily);
            resetTableAndFileInput();
            resetReportResults();
        }

        // Función para actualizar los encabezados de la tabla
        function updateTableHeaders(isDaily) {
            const tableHeader = document.getElementById("tableHeader");
            tableHeader.innerHTML = isDaily ?
                `<tr>
                    <th>Fecha</th>
                    <th>Ventas</th>
                    <th>Transacciones</th>
                    <th>Unidades</th>
                </tr>` :
                `<tr>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Ventas</th>
                    <th>Transacciones</th>
                    <th>Unidades</th>
                </tr>`;
        }

        // Función para limpiar la tabla y el input de archivo
        function resetTableAndFileInput() {
            document.getElementById("tableBody").innerHTML = "";
            document.getElementById("fileInput").value = "";
            resetErrors();
            document.getElementById("fetchData").disabled = true;
        }

        // Función para limpiar mensajes de error
        function resetErrors() {
            document.getElementById("fileError").textContent = "";
            document.getElementById("dataError").textContent = "";
            document.getElementById("recordCount").textContent = "";
            document.getElementById("requestStatus").textContent = "";
            document.getElementById("requestStatus").className = "status-message";
        }

        // Función para limpiar resultados de reporte
        function resetReportResults() {
            document.getElementById("reportTableBody").innerHTML = "";
            document.getElementById("reportResults").classList.add("d-none");
            reportData = [];
        }

        // Función para manejar el cambio en el tipo de operación
        function handleOperationTypeChange() {
            const operationType = this.value;
            const fileSection = document.getElementById("fileSection");
            const transactionSection = document.getElementById("transactionSection");

            fileSection.classList.toggle("d-none", operationType !== "sales");
            transactionSection.classList.toggle("d-none", operationType !== "transactions");
            toggleTableVisibility();
            resetReportResults();
        }

        // Función para manejar la visualización de sensores
        async function handleShowSensors() {
            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value.trim();

            try {
                const response = await fetch(URL_Dinamica+"clientstores", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password,
                        format: "json"
                    })
                });

                // Si la respuesta no es OK, mostrar el mensaje de error recibido
                if (!response.ok) {
                    let errorMsg = "Credenciales incorrectas.";
                    try {
                        const errorData = await response.json();
                        // Muestra tanto el mensaje personalizado como el detalle del backend
                        errorMsg += errorData.details ? ` (${errorData.details})` : "";
                    } catch (e) {
                        // Si no es JSON, usa el mensaje por defecto
                    }
                    showStatusMessage(errorMsg, false, true); // El tercer parámetro indica que es error de autenticación
                    return;
                }
                // Si la autenticación es exitosa, limpia el mensaje de error
                showStatusMessage("", true, true);

                const data = await response.json();
                currentSensorData = data;
                console.log("Respuesta de la API (Client Stores):", data);

                const container = document.getElementById("sensorContainer");
                container.innerHTML = "";
                const InfoGeneral = document.getElementById("InfoGeneral");

                if (!data.store || !Array.isArray(data.store) || data.store.length === 0) {
                    container.innerHTML = `<div class="alert alert-warning">No hay sensores disponibles.</div>`;
                    InfoGeneral.classList.add("d-none");
                    return;
                }

                const select = document.createElement("select");
                select.className = "form-select";
                select.id = "sensorSelect";

                data.store.forEach(sensor => {
                    const option = document.createElement("option");
                    option.value = sensor.door[0]?.device[0]?.deviceid || "";
                    option.dataset.storename = sensor.storename;
                    option.textContent = `${sensor.storename} - ${sensor.door[0]?.device[0]?.deviceid || "N/A"}`;
                    select.appendChild(option);
                });

                container.appendChild(select);
                InfoGeneral.classList.remove("d-none");
                document.getElementById("username").disabled = true;
                document.getElementById("password").disabled = true;

            } catch (error) {
                console.error("Error al obtener los client stores:", error);
                showStatusMessage(`Error al obtener los client stores: ${error.message}`, false);
            }
        }

        // Función para manejar la carga de archivos
        function handleFileUpload(event) {
            const file = event.target.files[0];
            resetErrors();

            // Restablecer el valor del input
            event.target.value = '';

            if (!file) {
                document.getElementById("fileError").textContent = "No se ha seleccionado ningún archivo";
                return;
            }

            const validExtensions = ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
            if (!validExtensions.includes(file.type)) {
                document.getElementById("fileError").textContent = "Error: Solo se permiten archivos Excel (.xls, .xlsx)";
                event.target.value = "";
                return;
            }

            const reader = new FileReader();
            reader.readAsBinaryString(file);
            reader.onload = function (e) {
                processExcelFile(e.target.result);
            };
        }

        // Función para procesar el archivo Excel
        function processExcelFile(data) {
            try {
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

                if (sheet.length <= 1) {
                    document.getElementById("dataError").textContent = "El archivo debe contener al menos un registro.";
                    return;
                }

                const isDaily = document.getElementById("optionDay").checked;
                const headerRow = sheet[0];
                const expectedHeaders = isDaily ?
                    ["date", "sales", "transaction", "units"] :
                    ["date", "hour", "sales", "transaction", "units"];

                // Validar SOLO la cantidad de columnas
                if (headerRow.length !== expectedHeaders.length) {
                    document.getElementById("dataError").textContent =
                        `Error: La cantidad de columnas no coincide con la opción seleccionada (${isDaily ? "Por Día" : "Por Hora"}).`;
                    return;
                }

                processSheetData(sheet, isDaily);
            } catch (error) {
                console.error("Error al procesar el archivo Excel:", error);
                document.getElementById("dataError").textContent = "Error al procesar el archivo Excel.";
            }
        }

        // Función para procesar los datos de la hoja Excel
        function processSheetData(sheet, isDaily) {
            document.getElementById("tableBody").innerHTML = "";
            requests = [];
            const duplicateHours = new Set();
            let hasEmptyFields = false;
            let hasInvalidDates = false;
            const sensorSelect = document.getElementById("sensorSelect");
            const selectedOption = sensorSelect.options[sensorSelect.selectedIndex];

            for (let i = 1; i < sheet.length; i++) {
                const row = sheet[i];

                // Validar campos vacíos
                const emptyFields = row.slice(0, isDaily ? 4 : 5).some(cell => cell === undefined || cell === "");
                if (emptyFields) {
                    hasEmptyFields = true;
                    continue;
                }

                // Validar y convertir fecha
                let originalDate = row[0];
                let formattedDate = null;

                try {
                    // Intentar convertir diferentes formatos de fecha
                    formattedDate = convertExcelDate(originalDate);
                } catch (error) {
                    console.error(`Error en fila ${i + 1}:`, error);
                    hasInvalidDates = true;
                    document.getElementById("dataError").innerHTML +=
                        `<br>Fila ${i + 1}: Fecha inválida - "${originalDate}"`;
                    continue;
                }

                // Crear una copia de la fila con la fecha formateada
                const processedRow = [...row];
                processedRow[0] = formattedDate;

                const requestData = {
                    username: document.getElementById("username").value,
                    password: document.getElementById("password").value,
                    date: formattedDate,
                    hour: isDaily ? null : processedRow[1],
                    store: selectedOption.dataset.storename,
                    sales: isDaily ? processedRow[1] : processedRow[2],
                    transaction: isDaily ? processedRow[2] : processedRow[3],
                    units: isDaily ? processedRow[3] : processedRow[4],
                    checkouts: 0
                };

                // Verificar duplicados solo para "Por Hora"
                if (!isDaily && requests.some(req => req.date === requestData.date && req.hour === requestData.hour)) {
                    duplicateHours.add(`Fecha: ${requestData.date} Hora: ${requestData.hour}`);
                }

                requests.push(requestData);
                addTableRow(requestData, isDaily);
            }

            // Mostrar errores si existen
            if (hasEmptyFields) {
                document.getElementById("dataError").textContent = "El archivo contiene campos vacíos. Por favor, revise los datos.";
            }

            if (hasInvalidDates) {
                document.getElementById("dataError").innerHTML +=
                    "<br>Se detectaron fechas inválidas. Por favor, use formatos reconocibles como DD/MM/YYYY o YYYY-MM-DD.";
            }

            if (duplicateHours.size > 0) {
                document.getElementById("dataError").innerHTML +=
                    `<br>Error: Existen registros con la misma fecha y hora:<br>${[...duplicateHours].join("<br>")}`;
                return;
            }

            document.getElementById("recordCount").textContent = `Registros para cargar: ${requests.length}`;
            if (!hasEmptyFields && !hasInvalidDates && requests.length > 0) {
                document.getElementById("fetchData").disabled = false;
            }
        }

        // Función para convertir diferentes formatos de fecha a YYYY-MM-DD
        function convertExcelDate(dateValue) {
            // Si es un número de Excel (fecha serial), convertirlo
            if (typeof dateValue === 'number') {
                const excelEpoch = new Date(1899, 11, 30);
                const convertedDate = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
                return convertedDate.toISOString().split('T')[0];
            }

            // Si es un string, intentar parsear diferentes formatos
            if (typeof dateValue === 'string') {
                // Intentar formato DD/MM/YYYY
                const ddMMyyyy = dateValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                if (ddMMyyyy) {
                    return `${ddMMyyyy[3]}-${ddMMyyyy[2]}-${ddMMyyyy[1]}`;
                }

                // Intentar formato MM/DD/YYYY
                const mmDDyyyy = dateValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                if (mmDDyyyy) {
                    return `${mmDDyyyy[3]}-${mmDDyyyy[1]}-${mmDDyyyy[2]}`;
                }

                // Intentar formato YYYY-MM-DD (ya válido)
                const yyyyMMdd = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                if (yyyyMMdd) {
                    return dateValue;
                }
            }

            // Si es un objeto Date, formatearlo
            if (dateValue instanceof Date) {
                return dateValue.toISOString().split('T')[0];
            }

            // Si no coincide con ningún formato conocido
            throw new Error(`Formato de fecha no reconocido: ${dateValue}`);
        }

        // Función para agregar una fila a la tabla
        function addTableRow(requestData, isDaily) {
            const tr = document.createElement("tr");

            if (isDaily) {
                tr.innerHTML = `
                    <td>${requestData.date}</td>
                    <td>${requestData.sales}</td>
                    <td>${requestData.transaction}</td>
                    <td>${requestData.units}</td>
                `;
            } else {
                tr.innerHTML = `
                    <td>${requestData.date}</td>
                    <td>${requestData.hour}</td>
                    <td>${requestData.sales}</td>
                    <td>${requestData.transaction}</td>
                    <td>${requestData.units}</td>
                `;
            }

            document.getElementById("tableBody").appendChild(tr);
        }

        async function handleFetchData() {
            if (requests.length === 0) {
                showStatusMessage("No hay datos para enviar.", false);
                return;
            }

            // Deshabilitar botón al inicio
            const fetchButton = document.getElementById("fetchData");
            fetchButton.disabled = true;

            const isDaily = document.getElementById("optionDay").checked;
            const url = isDaily ? URL_Dinamica+"/sales" : URL_Dinamica+"/sales_hourly";
            let successfulRequests = 0;
            let errorMessage = "";

            // Configurar barra de progreso
            const progressBarContainer = document.getElementById("progressBarContainer");
            const progressBar = document.getElementById("progressBar");
            progressBarContainer.style.display = "block";
            progressBar.style.width = "0%";
            progressBar.textContent = "0%";

            // Función para actualizar progreso
            const updateProgress = (current, total) => {
                const percentage = Math.round((current / total) * 100);
                progressBar.style.width = `${percentage}%`;
                progressBar.textContent = `${percentage}%`;
                // Forzar actualización de renderizado
                progressBar.offsetHeight;
            };

            // Procesar solicitudes en secuencia
            for (let i = 0; i < requests.length; i++) {
                const data = requests[i];

                try {
                    const response = await fetch(url, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(data)
                    });

                    if (!response.ok) {
                        throw new Error(`Error ${response.status}`);
                    }

                    successfulRequests++;
                } catch (error) {
                    console.error(`Error en registro ${i + 1}:`, error);
                    errorMessage += `<br>Registro ${i + 1}: ${error.message || "Error desconocido"}`;
                }

                // Actualizar progreso después de cada solicitud
                updateProgress(i + 1, requests.length);
            }

            // Ocultar barra después de un breve retraso
            setTimeout(() => {
                progressBarContainer.style.display = "none";
                // Habilitar botón al final del proceso
                fetchButton.disabled = false;
            }, 1000);

            // Mostrar resultados
            if (successfulRequests > 0) {
                showStatusMessage(`Éxito: Se procesaron ${successfulRequests} registros correctamente.`, true);
            }

            if (errorMessage) {
                showStatusMessage(`Error en algunos registros: ${errorMessage}`, false);
            }
        }



        // Función para manejar la generación de reportes
        async function handleGenerateReport() {
            const fromDate = document.getElementById("fromDate").value;
            const toDate = document.getElementById("toDate").value;

            if (!fromDate || !toDate) {
                showStatusMessage("Por favor, complete ambos campos de fecha.", false);
                return;
            }

            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value.trim();

            if (!username || !password) {
                showStatusMessage("Por favor, ingrese usuario y contraseña.", false);
                return;
            }

            const isDaily = document.getElementById("optionDay").checked;
            const endpoint = isDaily ? "exporttraficcday" : "exporttraficchour";
            const sensorSelect = document.getElementById("sensorSelect");
            const selectedOption = sensorSelect.options[sensorSelect.selectedIndex];

            try {
                const response = await fetch(URL_Dinamica+`${endpoint}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: username,
                        password: password,
                        start_date: fromDate,
                        finish_date: toDate,
                        store: selectedOption.dataset.storename,
                        format: "json"
                    })
                });

                if (!response.ok) throw new Error(`Error: ${response.statusText}`);

                const data = await response.json();
                console.log(`Respuesta de la API (${endpoint}):`, data);
                reportData = data;
                displayReportResults(data, isDaily);
                showStatusMessage("Reporte generado exitosamente.", true);

            } catch (error) {
                console.error("Error al generar el reporte:", error);
                showStatusMessage(`Error al generar el reporte: ${error.message}`, false);
            }
        }

        // Función para mostrar los resultados del reporte
        function displayReportResults(data, isDaily) {
            const reportResults = document.getElementById("reportResults");
            const reportTableHeader = document.getElementById("reportTableHeader");
            const reportTableBody = document.getElementById("reportTableBody");

            reportTableHeader.innerHTML = "";
            reportTableBody.innerHTML = "";

            if (!data || (Array.isArray(data) && data.length === 0)) {
                reportTableBody.innerHTML = "<tr><td colspan='6' class='text-center'>No hay datos disponibles</td></tr>";
                reportResults.classList.remove("d-none");
                return;
            }

            // Crear encabezados
            reportTableHeader.innerHTML = isDaily ?
                `<tr>
                    <th>Store Code</th>
                    <th>Store</th>
                    <th>Fecha</th>
                    <th>Entradas (In)</th>
                    <th>Salidas (Out)</th>
                </tr>` :
                `<tr>
                    <th>Store Code</th>
                    <th>Store</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Entradas (In)</th>
                    <th>Salidas (Out)</th>
                </tr>`;

            // Procesar datos
            const dataArray = Array.isArray(data) ? data : [data];

            dataArray.forEach(item => {
                const row = document.createElement("tr");
                if (isDaily) {
                    row.innerHTML = `
                        <td>${item.storeCode || ''}</td>
                        <td>${item.store || ''}</td>
                        <td>${item.timeformatted || ''}</td>
                        <td>${item.in || '0'}</td>
                        <td>${item.out || '0'}</td>
                    `;
                } else {
                    const [date, time] = item.timeformatted ? item.timeformatted.split(' ') : ['', ''];
                    row.innerHTML = `
                        <td>${item.storeCode || ''}</td>
                        <td>${item.store || ''}</td>
                        <td>${date}</td>
                        <td>${time}</td>
                        <td>${item.in || '0'}</td>
                        <td>${item.out || '0'}</td>
                    `;
                }
                reportTableBody.appendChild(row);
            });

            reportResults.classList.remove("d-none");
        }

        // Función para manejar la exportación a Excel
        function handleExportToExcel() {
            if (!reportData || (Array.isArray(reportData) && reportData.length === 0)) {
                showStatusMessage("No hay datos para exportar.", false);
                return;
            }

            const isDaily = document.getElementById("optionDay").checked;
            const wb = XLSX.utils.book_new();
            const dataArray = Array.isArray(reportData) ? reportData : [reportData];

            const excelData = dataArray.map(item => {
                if (isDaily) {
                    return {
                        'Store Code': item.storeCode,
                        'Store': item.store,
                        'Fecha': item.timeformatted,
                        'Entradas (In)': item.in || '0',
                        'Salidas (Out)': item.out || '0'
                    };
                } else {
                    const [date, time] = item.timeformatted ? item.timeformatted.split(' ') : ['', ''];
                    return {
                        'Store Code': item.storeCode,
                        'Store': item.store,
                        'Fecha': date,
                        'Hora': time,
                        'Entradas (In)': item.in || '0',
                        'Salidas (Out)': item.out || '0'
                    };
                }
            });

            const ws = XLSX.utils.json_to_sheet(excelData);
            XLSX.utils.book_append_sheet(wb, ws, "Reporte");

            const fechaActual = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `Reporte_${fechaActual}.xlsx`);
        }

        // Función para mostrar mensajes de estado
        function showStatusMessage(message, isSuccess, isAuthError = false) {
            if (isAuthError) {
                const authError = document.getElementById("authError");
                authError.textContent = message;
                authError.className = isSuccess ? "text-success mt-2" : "text-danger mt-2";
            } else {
                const statusElement = document.getElementById("requestStatus");
                statusElement.innerHTML = "";
                statusElement.textContent = message;
                statusElement.className = `status-message text-center mt-2 ${isSuccess ? 'status-success' : 'status-error'}`;
            }
        }
/**
 * clientAPI.js
 * API para consultar DNI y RUC
 */

/**
 * Consultar DNI usando API pública
 */
async function consultarDNI(dni) {
  try {
    // Validar formato
    if (!/^\d{8}$/.test(dni)) {
      throw new Error('DNI debe tener 8 dígitos');
    }

    console.log('🔍 Consultando DNI:', dni);

    // API 1: APIs Perú (más confiable)
    try {
      const response = await fetch(
        `https://api.apis.net.pe/v2/reniec/dni?numero=${dni}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Status API 1:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ DNI encontrado (API 1):', data);
        
        return {
          success: true,
          documento: dni,
          nombre: data.nombres,
          apellidoPaterno: data.apellidoPaterno,
          apellidoMaterno: data.apellidoMaterno,
          nombreCompleto: `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`.trim()
        };
      }
    } catch (error) {
      console.log('⚠️ API 1 falló:', error.message);
    }

    // API 2: API alternativa con token
    try {
      const response = await fetch(
        `https://dniruc.apisperu.com/api/v1/dni/${dni}?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIn0.E-0f5hSNYf3a8fXpAzXvDAXxGmKwh9XLxKbCh7yKxYE`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      console.log('Status API 2:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ DNI encontrado (API 2):', data);
        
        return {
          success: true,
          documento: dni,
          nombre: data.nombres,
          apellidoPaterno: data.apellidoPaterno,
          apellidoMaterno: data.apellidoMaterno,
          nombreCompleto: `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`.trim()
        };
      }
    } catch (error) {
      console.log('⚠️ API 2 también falló:', error.message);
    }

    throw new Error('No se encontró el DNI en las bases de datos');

  } catch (error) {
    console.error('❌ Error consultando DNI:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Consultar RUC usando API pública
 */
async function consultarRUC(ruc) {
  try {
    // Validar formato
    if (!/^\d{11}$/.test(ruc)) {
      throw new Error('RUC debe tener 11 dígitos');
    }

    console.log('🔍 Consultando RUC:', ruc);

    // API 1: APIs Perú
    try {
      const response = await fetch(
        `https://api.apis.net.pe/v2/sunat/ruc?numero=${ruc}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Status API 1:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ RUC encontrado (API 1):', data);
        
        return {
          success: true,
          documento: ruc,
          razonSocial: data.nombre || data.razonSocial,
          nombreCompleto: data.nombre || data.razonSocial,
          estado: data.estado,
          condicion: data.condicion,
          direccion: data.direccion,
          departamento: data.departamento,
          provincia: data.provincia,
          distrito: data.distrito
        };
      }
    } catch (error) {
      console.log('⚠️ API 1 falló:', error.message);
    }

    // API 2: API alternativa
    try {
      const response = await fetch(
        `https://dniruc.apisperu.com/api/v1/ruc/${ruc}?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIn0.E-0f5hSNYf3a8fXpAzXvDAXxGmKwh9XLxKbCh7yKxYE`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      console.log('Status API 2:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ RUC encontrado (API 2):', data);
        
        return {
          success: true,
          documento: ruc,
          razonSocial: data.razonSocial,
          nombreCompleto: data.razonSocial,
          estado: data.estado,
          condicion: data.condicion,
          direccion: data.direccion,
          departamento: data.departamento,
          provincia: data.provincia,
          distrito: data.distrito
        };
      }
    } catch (error) {
      console.log('⚠️ API 2 también falló:', error.message);
    }

    throw new Error('No se encontró el RUC en las bases de datos');

  } catch (error) {
    console.error('❌ Error consultando RUC:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Consultar documento (detecta automáticamente si es DNI o RUC)
 */
async function consultarDocumento(documento) {
  const doc = documento.trim();
  
  if (doc.length === 8) {
    return await consultarDNI(doc);
  } else if (doc.length === 11) {
    return await consultarRUC(doc);
  } else {
    return {
      success: false,
      error: 'Documento debe tener 8 dígitos (DNI) u 11 dígitos (RUC)'
    };
  }
}
// === Gerar radios ===
const relacoes = ["Colaboradores", "Fornecedores", "Clientes", "Prestadores de serviços"];
const tiposDenuncia = [
  "Assédio Moral ou comportamento inadequado", "Assédio Sexual", "Corrupção", "Conflito de interesses",
  "Fraude", "Infração aos direitos humanos e discriminação", "Roubos, furtos e qualquer destruição de ativos",
  "Uso indevido de informações privilegiadas ou confidenciais", "Outros Incidentes"
];

function criarRadio(containerId, name, value, texto) {
  const container = document.getElementById(containerId);
  const label = document.createElement('label');
  label.className = 'flex items-center cursor-pointer';
  label.innerHTML = `
    <input type="radio" name="${name}" value="${value}" class="sr-only peer" required />
    <span class="w-full py-3 px-4 border border-gray-300 rounded-lg peer-checked:bg-primary peer-checked:text-white peer-focus:ring-2 peer-focus:ring-primary transition text-sm font-medium text-center">
      ${texto}
    </span>
  `;
  container.appendChild(label);
}

relacoes.forEach(rel => {
  const value = rel.toUpperCase().replace(/ /g, '_').replace(/Ç/g, 'C');
  criarRadio('relationshipContainer', 'relationship', value, rel);
});

tiposDenuncia.forEach(tipo => {
  let value = tipo.toUpperCase().replace(/Á/g, 'A').replace(/Ç/g, 'C').replace(/Õ/g, 'O').replace(/ /g, '_').replace(/,/g, '');
  criarRadio('tipoDenunciaContainer', 'type', value, tipo);
});

// === Elementos condicionais ===
const identificacaoCampos = document.getElementById('identificacaoCampos');
const witnessesField = document.getElementById('witnessesField');
const witnessNamesInput = document.getElementById('witnessNames');

// === FUNÇÃO DE ANIMAÇÃO CORRIGIDA ===
function toggleField(field, show) {
  if (show) {
    field.classList.remove('hidden');
    const height = field.scrollHeight;
    field.style.height = '0px';
    field.offsetHeight; // força reflow
    field.style.height = height + 'px';
    field.classList.add('opacity-100');
  } else {
    field.style.height = field.scrollHeight + 'px';
    field.offsetHeight;
    field.style.height = '0px';
    field.classList.remove('opacity-100');
    setTimeout(() => {
      if (field.style.height === '0px') field.classList.add('hidden');
    }, 500);
  }
}

// === Identificação ===
document.querySelectorAll('input[name="isIdentified"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const show = radio.value === 'YES';
    toggleField(identificacaoCampos, show);
    ['fullName', 'jobTitle', 'phone', 'email'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el[show ? 'setAttribute' : 'removeAttribute']('required', '');
        if (!show) {
          el.value = '';
          const counter = el.parentElement.querySelector('.char-counter');
          if (counter) counter.textContent = `0/${el.maxLength} caracteres`;
        }
      }
    });
  });
});

// === Testemunhas ===
document.querySelectorAll('input[name="hasWitnesses"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const show = radio.value === 'YES';
    toggleField(witnessesField, show);
    if (witnessNamesInput) {
      witnessNamesInput[show ? 'setAttribute' : 'removeAttribute']('required', '');
      if (!show) {
        witnessNamesInput.value = '';
        witnessNamesInput.parentElement.querySelector('.char-counter').textContent = '0/500 caracteres';
      }
    }
  });
});

// === Ajuste de altura ===
[identificacaoCampos, witnessesField].forEach(field => {
  field.addEventListener('transitionend', e => {
    if (e.propertyName === 'height') {
      if (field.style.height !== '0px') {
        field.style.height = 'auto';
      } else {
        field.classList.add('hidden');
      }
    }
  });
});

// === Contador unificado ===
document.querySelectorAll('input[maxlength], textarea[maxlength]').forEach(el => {
  const counter = el.parentElement.querySelector('.char-counter');
  if (!counter) return;
  const max = el.getAttribute('maxlength');
  const update = () => counter.textContent = `${el.value.length}/${max} caracteres`;
  el.addEventListener('input', update);
  update();
});

// === Upload ===
const fileInput = document.getElementById('evidenceFiles');
const fileList = document.getElementById('file-list');
fileInput.addEventListener('change', () => {
  fileList.innerHTML = '';
  Array.from(fileInput.files).forEach(file => {
    if (file.size > 1024 * 1024 * 1024) {
      alert(`Arquivo "${file.name}" excede 1 GB.`);
      return;
    }
    const div = document.createElement('div');
    div.className = 'text-sm text-gray-600 flex justify-between items-center bg-gray-50 p-2 rounded';
    div.innerHTML = `
      <span>${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
      <button type="button" class="text-red-500 hover:text-red-700 text-xl">&times;</button>
    `;
    div.querySelector('button').onclick = () => {
      div.remove();
      const dt = new DataTransfer();
      Array.from(fileInput.files).filter(f => f !== file).forEach(f => dt.items.add(f));
      fileInput.files = dt.files;
    };
    fileList.appendChild(div);
  });
});

// === VALIDAÇÃO + ENVIO (ALTERAÇÃO PRINCIPAL) ===
const form = document.getElementById('denunciaForm');
const submitBtn = document.getElementById('submitBtn');
const submitText = document.getElementById('submitText');
const loadingIcon = document.getElementById('loadingIcon');
const protocoloSection = document.getElementById('protocoloSection');
const protocoloNumero = document.getElementById('protocoloNumero');

function validar() {
  // (mesma função validar que você já tinha – mantida 100% igual)
  let valido = true;
  const campos = [
    'isIdentified', 'relationship', 'wbOrgName', 'type', 'location',
    'eventDate', 'reportedPerson', 'keepHappening', 'hasWitnesses',
    'description', 'confidenceLevel'
  ];

  campos.forEach(name => {
    const el = document.querySelector(`[name="${name}"]`) || document.getElementById(name);
    const error = document.getElementById(`error-${name}`);
    if (!el || !error) return;

    const valor = name === 'location' ? el.value :
      name.includes('radio') ? document.querySelector(`input[name="${name}"]:checked`) :
      el.value.trim();

    if (!valor) {
      error.classList.remove('hidden');
      el.classList.add('input-error');
      valido = false;
    } else {
      error.classList.add('hidden');
      el.classList.remove('input-error');
    }
  });

  // Identificação condicional
  if (document.querySelector('input[name="isIdentified"]:checked')?.value === 'YES') {
    ['fullName', 'jobTitle', 'phone', 'email'].forEach(id => {
      const el = document.getElementById(id);
      const error = document.getElementById(`error-${id}`);
      if (!el || !error) return;
      if (!el.value.trim()) {
        error.classList.remove('hidden');
        el.classList.add('input-error');
        valido = false;
      } else {
        error.classList.add('hidden');
        el.classList.remove('input-error');
        if (id === 'email' && !/^\S+@\S+\.\S+$/.test(el.value)) {
          error.classList.remove('hidden');
          el.classList.add('input-error');
          valido = false;
        }
      }
    });
  }

  // Testemunhas condicional
  const hasWitnessesYes = document.querySelector('input[name="hasWitnesses"]:checked')?.value === 'YES';
  const witnessEl = document.getElementById('witnessNames');
  const errorWitness = document.getElementById('error-witnessNames');
  if (hasWitnessesYes && witnessEl && errorWitness) {
    if (!witnessEl.value.trim()) {
      errorWitness.classList.remove('hidden');
      witnessEl.classList.add('input-error');
      valido = false;
    } else {
      errorWitness.classList.add('hidden');
      witnessEl.classList.remove('input-error');
    }
  }

  if (!valido) {
    const firstError = document.querySelector('.input-error');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => firstError.focus(), 300);
    }
  }
  return valido;
}


form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!validar()) {
    alert('Preencha todos os campos obrigatórios corretamente.');
    return;
  }

  submitText.textContent = 'Enviando...';
  loadingIcon.classList.remove('(hidden');
  submitBtn.disabled = true;

  try {
    const files = fileInput.files;

    // === GERA O PROTOCOLO ANTES DO ENVIO ===
    const now = new Date();
    const protocolo = `${now.getFullYear().toString().slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // === Montagem da mensagem HTML ===
    const isIdentified = document.querySelector('input[name="isIdentified"]:checked')?.value === 'YES';
    const identificacao = isIdentified
      ? `<p><strong>Nome:</strong> ${document.getElementById('fullName').value}</p>
         <p><strong>Cargo:</strong> ${document.getElementById('jobTitle').value}</p>
         <p><strong>Telefone:</strong> ${document.getElementById('phone').value}</p>
         <p><strong>E-mail:</strong> ${document.getElementById('email').value}</p>`
      : '<p><strong>Denunciante anônimo</strong></p>';

    const messageHTML = `
      <h2>Nova Denúncia – Protocolo: ${protocolo}</h2>
      <hr>
      <p><strong>Data/Hora:</strong> ${now.toLocaleString('pt-BR')}</p>
      ${identificacao}
      <p><strong>Relação com a empresa:</strong> ${document.querySelector('input[name="relationship"]:checked')?.nextElementSibling.textContent.trim()}</p>
      <p><strong>Empresa:</strong> ${document.getElementById('wbOrgName').value}</p>
      <p><strong>Tipo de denúncia:</strong> ${document.querySelector('input[name="type"]:checked')?.nextElementSibling.textContent.trim()}</p>
      <p><strong>Local:</strong> ${document.getElementById('location').selectedOptions[0].textContent}</p>
      <p><strong>Quando ocorreu:</strong> ${document.getElementById('eventDate').value}</p>
      <p><strong>Envolvido(s):</strong> ${document.getElementById('reportedPerson').value}</p>
      <p><strong>Continua ocorrendo:</strong> ${document.querySelector('input[name="keepHappening"]:checked')?.nextElementSibling.textContent.trim()}</p>
      <p><strong>Testemunhas:</strong> ${document.querySelector('input[name="hasWitnesses"]:checked')?.value === 'YES' ? 'Sim – ' + (document.getElementById('witnessNames').value || 'não informado') : 'Não'}</p>
      <p><strong>Grau de certeza:</strong> ${document.querySelector('input[name="confidenceLevel"]:checked')?.nextElementSibling.textContent.trim()}</p>
      <hr>
      <h3>Descrição completa</h3>
      <p style="white-space: pre-wrap;">${document.getElementById('description').value.replace(/\n/g, '<br>')}</p>
      ${files.length > 0 ? '<p><strong>Anexos:</strong> ' + Array.from(files).map(f => f.name).join(', ') + '</p>' : ''}
      <hr>
      <small>Enviado via Canal de Denúncia – CittàTelecom</small>
    `.trim();

    const payloadBase = {
      email: "sidnei.junior@cittatelecom.net.br",
      subject: `Nova Denúncia – Protocolo: ${protocolo}`,   // ← PROTOCOLO NO ASSUNTO
      message: messageHTML
    };

    let response;

    if (files.length === 0) {
      // SEM anexo
      response = await fetch('http://192.168.12.204:7075/mailMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadBase)
      });
    } else {
      // COM anexo (primeiro arquivo)
      const file = files[0];
      const base64 = await fileToBase64(file);

      const payloadWithAttachment = {
        ...payloadBase,
        filename: file.name,
        path: `data:${file.type};base64,${base64}`
      };

      response = await fetch('http://192.168.12.204:7075/mailAttachments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadWithAttachment)
      });
    }

    // === Resposta ===
    if (response.ok) {
      protocoloNumero.textContent = protocolo;
      protocoloSection.classList.remove('hidden');
      submitText.textContent = 'Enviado!';
      setTimeout(() => {
        alert(`Denúncia enviada com sucesso!\n\nProtocolo: ${protocolo}\nGuarde este número para acompanhamento.`);
      }, 300);
    } else {
      throw new Error(`HTTP ${response.status}`);
    }

  } catch (err) {
    console.error('Erro no envio:', err);
    alert('Erro ao enviar a denúncia. Tente novamente.');
    submitText.textContent = 'Enviar';
    loadingIcon.classList.add('hidden');
    submitBtn.disabled = false;
  }
});

// ==== Função auxiliar para converter arquivo → base64 ====
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}



/* 
  // === Gerar radios ===
  const relacoes = ["Colaboradores", "Fornecedores", "Clientes", "Prestadores de serviços"];
  const tiposDenuncia = [
    "Assédio Moral ou comportamento inadequado", "Assédio Sexual", "Corrupção", "Conflito de interesses",
    "Fraude", "Infração aos direitos humanos e discriminação", "Roubos, furtos e qualquer destruição de ativos",
    "Uso indevido de informações privilegiadas ou confidenciais", "Outros Incidentes"
  ];

  function criarRadio(containerId, name, value, texto) {
    const container = document.getElementById(containerId);
    const label = document.createElement('label');
    label.className = 'flex items-center cursor-pointer';
    label.innerHTML = `
      <input type="radio" name="${name}" value="${value}" class="sr-only peer" required />
      <span class="w-full py-3 px-4 border border-gray-300 rounded-lg peer-checked:bg-primary peer-checked:text-white peer-focus:ring-2 peer-focus:ring-primary transition text-sm font-medium text-center">
        ${texto}
      </span>
    `;
    container.appendChild(label);
  }

  relacoes.forEach(rel => {
    const value = rel.toUpperCase().replace(/ /g, '_').replace(/Ç/g, 'C');
    criarRadio('relationshipContainer', 'relationship', value, rel);
  });

  tiposDenuncia.forEach(tipo => {
    let value = tipo.toUpperCase().replace(/Á/g, 'A').replace(/Ç/g, 'C').replace(/Õ/g, 'O').replace(/ /g, '_').replace(/,/g, '');
    criarRadio('tipoDenunciaContainer', 'type', value, tipo);
  });

  // === Elementos condicionais ===
  const identificacaoCampos = document.getElementById('identificacaoCampos');
  const witnessesField = document.getElementById('witnessesField');
  const witnessNamesInput = document.getElementById('witnessNames');

  // === FUNÇÃO DE ANIMAÇÃO CORRIGIDA ===
  function toggleField(field, show) {
    if (show) {
      // MOSTRAR
      field.classList.remove('hidden');
      const height = field.scrollHeight;
      field.style.height = '0px';
      field.offsetHeight; // força reflow
      field.style.height = height + 'px';
      field.classList.add('opacity-100');
    } else {
      // ESCONDER
      field.style.height = field.scrollHeight + 'px';
      field.offsetHeight;
      field.style.height = '0px';
      field.classList.remove('opacity-100');
      setTimeout(() => {
        if (field.style.height === '0px') {
          field.classList.add('hidden');
        }
      }, 500);
    }
  }

  // === Identificação ===
  document.querySelectorAll('input[name="isIdentified"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const show = radio.value === 'YES';
      toggleField(identificacaoCampos, show);
      ['fullName', 'jobTitle', 'phone', 'email'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el[show ? 'setAttribute' : 'removeAttribute']('required', '');
          if (!show) {
            el.value = '';
            const counter = el.parentElement.querySelector('.char-counter');
            if (counter) counter.textContent = `0/${el.maxLength} caracteres`;
          }
        }
      });
    });
  });

  // === Testemunhas ===
  document.querySelectorAll('input[name="hasWitnesses"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const show = radio.value === 'YES';
      toggleField(witnessesField, show);
      if (witnessNamesInput) {
        witnessNamesInput[show ? 'setAttribute' : 'removeAttribute']('required', '');
        if (!show) {
          witnessNamesInput.value = '';
          witnessNamesInput.parentElement.querySelector('.char-counter').textContent = '0/500 caracteres';
        }
      }
    });
  });

  // === Ajuste de altura CORRIGIDO ===
  [identificacaoCampos, witnessesField].forEach(field => {
    field.addEventListener('transitionend', e => {
      if (e.propertyName === 'height') {
        if (field.style.height !== '0px') {
          field.style.height = 'auto';
        } else {
          field.classList.add('hidden');
        }
      }
    });
  });

  // === Contador unificado ===
  document.querySelectorAll('input[maxlength], textarea[maxlength]').forEach(el => {
    const counter = el.parentElement.querySelector('.char-counter');
    if (!counter) return;
    const max = el.getAttribute('maxlength');
    const update = () => counter.textContent = `${el.value.length}/${max} caracteres`;
    el.addEventListener('input', update);
    update();
  });

  // === Upload ===
  const fileInput = document.getElementById('evidenceFiles');
  const fileList = document.getElementById('file-list');
  fileInput.addEventListener('change', () => {
    fileList.innerHTML = '';
    Array.from(fileInput.files).forEach(file => {
      if (file.size > 1024 * 1024 * 1024) {
        alert(`Arquivo "${file.name}" excede 1 GB.`);
        return;
      }
      const div = document.createElement('div');
      div.className = 'text-sm text-gray-600 flex justify-between items-center bg-gray-50 p-2 rounded';
      div.innerHTML = `
        <span>${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
        <button type="button" class="text-red-500 hover:text-red-700 text-xl">&times;</button>
      `;
      div.querySelector('button').onclick = () => {
        div.remove();
        const dt = new DataTransfer();
        Array.from(fileInput.files).filter(f => f !== file).forEach(f => dt.items.add(f));
        fileInput.files = dt.files;
      };
      fileList.appendChild(div);
    });
  });

  // === VALIDAÇÃO + ENVIO ===
  const form = document.getElementById('denunciaForm');
  const submitBtn = document.getElementById('submitBtn');
  const submitText = document.getElementById('submitText');
  const loadingIcon = document.getElementById('loadingIcon');
  const protocoloSection = document.getElementById('protocoloSection');
  const protocoloNumero = document.getElementById('protocoloNumero');

  function validar() {
    let valido = true;

    const campos = [
      'isIdentified', 'relationship', 'wbOrgName', 'type', 'location',
      'eventDate', 'reportedPerson', 'keepHappening', 'hasWitnesses',
      'description', 'confidenceLevel'
    ];

    campos.forEach(name => {
      const el = document.querySelector(`[name="${name}"]`) || document.getElementById(name);
      const error = document.getElementById(`error-${name}`);
      if (!el || !error) return;

      const valor = name === 'location' ? el.value :
        name.includes('radio') ? document.querySelector(`input[name="${name}"]:checked`) :
        el.value.trim();

      if (!valor) {
        error.classList.remove('hidden');
        el.classList.add('input-error');
        valido = false;
      } else {
        error.classList.add('hidden');
        el.classList.remove('input-error');
      }
    });

    // Identificação
    if (document.querySelector('input[name="isIdentified"]:checked')?.value === 'YES') {
      ['fullName', 'jobTitle', 'phone', 'email'].forEach(id => {
        const el = document.getElementById(id);
        const error = document.getElementById(`error-${id}`);
        if (!el || !error) return;
        if (!el.value.trim()) {
          error.classList.remove('hidden');
          el.classList.add('input-error');
          valido = false;
        } else {
          error.classList.add('hidden');
          el.classList.remove('input-error');
          if (id === 'email' && !/^\S+@\S+\.\S+$/.test(el.value)) {
            error.classList.remove('hidden');
            el.classList.add('input-error');
            valido = false;
          }
        }
      });
    }

    // Testemunhas
    const hasWitnessesYes = document.querySelector('input[name="hasWitnesses"]:checked')?.value === 'YES';
    const witnessEl = document.getElementById('witnessNames');
    const errorWitness = document.getElementById('error-witnessNames');
    if (hasWitnessesYes && witnessEl && errorWitness) {
      if (!witnessEl.value.trim()) {
        errorWitness.classList.remove('hidden');
        witnessEl.classList.add('input-error');
        valido = false;
      } else {
        errorWitness.classList.add('hidden');
        witnessEl.classList.remove('input-error');
      }
    }

    // Foco no primeiro erro
    if (!valido) {
      const firstError = document.querySelector('.input-error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => firstError.focus(), 300);
      }
    }

    return valido;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validar()) {
      alert('Preencha todos os campos obrigatórios corretamente.');
      return;
    }

    submitText.textContent = 'Enviando...';
    loadingIcon.classList.remove('hidden');
    submitBtn.disabled = true;

    const formData = new FormData(form);
    Array.from(fileInput.files).forEach(file => formData.append('evidenceFiles', file));
    
    try {
      const response = await fetch('http://192.168.12.204:7075/mailMessage', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = new Date();
        const protocolo = `${data.getFullYear().toString().slice(2)}${(data.getMonth()+1).toString().padStart(2,'0')}${data.getDate().toString().padStart(2,'0')}-${Math.random().toString(36).substr(2,6).toUpperCase()}`;
        protocoloNumero.textContent = protocolo;
        protocoloSection.classList.remove('hidden');
        submitText.textContent = 'Enviado!';
        setTimeout(() => {
          alert(`Denúncia enviada!\nProtocolo: ${protocolo}`);
        }, 300);
      } else throw new Error();
    } catch {
      alert('Erro ao enviar. Tente novamente.');
      submitText.textContent = 'Enviar';
      loadingIcon.classList.add('hidden');
      submitBtn.disabled = false;
    }
  });
 */




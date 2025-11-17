// ==== ENVIO INTELIGENTE (com protocolo no assunto) ====
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

      response = await fetch('http://192.168.12.204:7075/mailMessageWithAttachment', {
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

// Função auxiliar (deixa no final do script)
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
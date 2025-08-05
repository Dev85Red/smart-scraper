// public\assets\script.js
fetch('/api/profiles')
    .then(res => res.json())
    .then(data => {
        const tbody = document.querySelector('tbody');
        tbody.innerHTML = '';
        data.forEach(profile => {
            const rowIndex = profile.rowIndex;
            const subjectKey = `copied_subject_${rowIndex}`;
            const messageKey = `copied_message_${rowIndex}`;

            const subjectCopied = localStorage.getItem(subjectKey);
            const messageCopied = localStorage.getItem(messageKey);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${profile.rowIndex}</td>
                <td>
                    <select data-row="${rowIndex}">
                        <option ${profile.status === 'pending' ? 'selected' : ''}>pending</option>
                        <option ${profile.status === 'sent' ? 'selected' : ''}>sent</option>
                        <option ${profile.status === 'issue' ? 'selected' : ''}>issue</option>
                    </select>
                </td>
                <td>${profile.name}</td>
                <td><a href="${profile.linkedin}" class="url-link" target="_blank">🔗 Profile</a></td>
                <td>${profile.designation.slice(0, 50)}...</td>
                <td>
                    ${profile.subject}
                    </br>
                    <button class="copy-btn" data-type="subject" data-row="${rowIndex}">
                        ${subjectCopied ? '✅ Copied!' : '📋 Copy'}
                    </button>
                </td>
                <td>
                    ${profile.message}
                    </br>
                    <button class="copy-btn" data-type="message" data-row="${rowIndex}">
                        ${messageCopied ? '✅ Copied!' : '📋 Copy'}
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Status update
        document.querySelectorAll('select').forEach(select => {
            select.addEventListener('change', async e => {
                const rowIndex = e.target.getAttribute('data-row');
                const newStatus = e.target.value;
                await fetch('/api/update-status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rowIndex, newStatus }),
                });
            });
        });

        // Copy button
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const rowIndex = btn.getAttribute('data-row');
                const type = btn.getAttribute('data-type');
                const contentCell = btn.parentElement;
                const content = contentCell.firstChild.textContent.trim();

                navigator.clipboard.writeText(content).then(() => {
                    localStorage.setItem(`copied_${type}_${rowIndex}`, true);
                    btn.textContent = '✅ Copied!';
                    btn.disabled = true;
                    setTimeout(() => {
                        btn.textContent = '📋 Copy';
                        btn.disabled = false;
                        localStorage.removeItem(`copied_${type}_${rowIndex}`);
                    }, 15000);
                });
            });
        });
    });

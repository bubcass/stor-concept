function encodeHtmlAttribute(value: string) {
  return encodeURIComponent(value);
}

function normalizeTableHtml(tableHtml: string) {
  const document = new DOMParser().parseFromString(tableHtml, 'text/html');
  const table = document.querySelector('table');
  if (!table) return tableHtml;

  const rows = Array.from(table.querySelectorAll('tr'));
  if (!rows.length) return table.outerHTML;

  const headerCells = table.querySelectorAll('th');
  if (!headerCells.length) {
    const firstRow = rows[0];
    if (firstRow) {
      const promotedCells = Array.from(firstRow.children)
        .filter((cell): cell is HTMLTableCellElement => cell instanceof HTMLTableCellElement)
        .map((cell) => {
          const th = document.createElement('th');
          th.innerHTML = cell.innerHTML;
          th.setAttribute('scope', 'col');

          for (const attr of Array.from(cell.attributes)) {
            if (attr.name === 'scope') continue;
            th.setAttribute(attr.name, attr.value);
          }

          return th;
        });

      if (promotedCells.length) {
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        for (const cell of promotedCells) {
          headerRow.appendChild(cell);
        }
        thead.appendChild(headerRow);

        const rowParent = firstRow.parentElement;
        if (rowParent?.tagName === 'TBODY') {
          table.insertBefore(thead, rowParent);
          rowParent.removeChild(firstRow);

          if (!rowParent.children.length) {
            rowParent.remove();
          }
        } else if (rowParent === table) {
          table.replaceChild(thead, firstRow);
        }
      }
    }
  }

  if (!table.querySelector('tbody')) {
    const bodyRows = Array.from(table.querySelectorAll(':scope > tr'));
    if (bodyRows.length) {
      const tbody = document.createElement('tbody');
      for (const row of bodyRows) {
        tbody.appendChild(row);
      }
      table.appendChild(tbody);
    }
  }

  return table.outerHTML;
}

export function transformImportedHtml(html: string) {
  return html.replace(/<table[\s\S]*?<\/table>/gi, (tableHtml) => {
    const encoded = encodeHtmlAttribute(normalizeTableHtml(tableHtml));
    return `<stor-table data-html="${encoded}"></stor-table>`;
  });
}

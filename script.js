document.addEventListener('DOMContentLoaded', function () {
    const workspace = Blockly.inject('blocklyDiv', {
        toolbox: {
            "kind": "categoryToolbox",
            "contents": [
                {
                    "kind": "category",
                    "name": "Requêtes HTTP",
                    "colour": "#5b80a5",
                    "contents": [
                        { "kind": "block", "type": "http_request" },
                        { "kind": "block", "type": "set_header" },
                        { "kind": "block", "type": "set_body" }
                    ]
                },
                {
                    "kind": "category",
                    "name": "Variables",
                    "colour": "#5ba55b",
                    "contents": [
                        { "kind": "block", "type": "variables_set" },
                        { "kind": "block", "type": "variables_get" }
                    ]
                },
                {
                    "kind": "category",
                    "name": "Logique",
                    "colour": "#a55b80",
                    "contents": [
                        { "kind": "block", "type": "controls_if" },
                        { "kind": "block", "type": "logic_compare" }
                    ]
                }
            ]
        },
        trashcan: true
    });

    // Bloc http_request
    Blockly.Blocks['http_request'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("Méthode")
                .appendField(new Blockly.FieldDropdown([
                    ["GET", "GET"],
                    ["POST", "POST"],
                    ["PUT", "PUT"],
                    ["DELETE", "DELETE"],
                    ["PATCH", "PATCH"]
                ]), "METHOD");
            this.appendValueInput("URL")
                .setCheck("String")
                .appendField("URL");
            this.appendStatementInput("HEADERS")
                .appendField("En-têtes");
            this.appendStatementInput("BODY")
                .appendField("Corps");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(120);
            this.setTooltip("Crée une requête HTTP");
        }
    };

    Blockly.JavaScript['http_request'] = function (block) {
        const method = block.getFieldValue('METHOD');
        const url = Blockly.JavaScript.valueToCode(block, 'URL', Blockly.JavaScript.ORDER_ATOMIC) || "''";
        const headersCode = Blockly.JavaScript.statementToCode(block, 'HEADERS');
        const bodyCode = Blockly.JavaScript.statementToCode(block, 'BODY');

        return `const request = {
    method: '${method}',
    url: ${url},
    headers: { ${headersCode} },
    body: ${bodyCode || 'null'}
};\n\nawait executeRequest(request);\n`;
    };

    // Bloc set_header
    Blockly.Blocks['set_header'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("En-tête")
                .appendField(new Blockly.FieldTextInput("Content-Type"), "HEADER_NAME");
            this.appendValueInput("HEADER_VALUE")
                .setCheck("String")
                .appendField("Valeur");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(120);
            this.setTooltip("Ajoute un en-tête HTTP");
        }
    };

    Blockly.JavaScript['set_header'] = function (block) {
        const headerName = block.getFieldValue('HEADER_NAME');
        const headerValueBlock = block.getInputTargetBlock('HEADER_VALUE');
        let headerValue = "''";
        if (headerValueBlock && headerValueBlock.type === 'text') {
            headerValue = `'${headerValueBlock.getFieldValue('TEXT')}'`;
        }
        return `"${headerName}": ${headerValue},\n`;
    };

    // Bloc set_body
    Blockly.Blocks['set_body'] = {
        init: function () {
            this.appendDummyInput().appendField("Corps de la requête");
            this.appendValueInput("BODY_CONTENT").setCheck(null);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(120);
            this.setTooltip("Définit le corps de la requête");
        }
    };

    Blockly.JavaScript['set_body'] = function (block) {
        const bodyBlock = block.getInputTargetBlock('BODY_CONTENT');
        let bodyContent = '{}';
        if (bodyBlock && bodyBlock.type === 'text') {
            bodyContent = `JSON.parse('${bodyBlock.getFieldValue('TEXT').replace(/'/g, "\\'")}')`;
        }
        return `${bodyContent}`;
    };

    // Fonction pour exécuter la requête
    async function executeRequest(request) {
        const responsePreview = document.getElementById('requestPreview');
        const statusCode = document.getElementById('statusCode');
        const responseOutput = document.getElementById('responseOutput');

        responsePreview.innerHTML = `
            <strong>${request.method}</strong> ${request.url}<br><br>
            <strong>En-têtes:</strong><br>
            ${Object.entries(request.headers || {}).map(([k, v]) => `${k}: ${v}`).join('<br>')}<br><br>
            <strong>Corps:</strong><br>
            ${request.body ? JSON.stringify(request.body, null, 2) : 'Aucun'}
        `;

        try {
            const response = await fetch(request.url, {
                method: request.method,
                headers: request.headers,
                body: (request.method !== 'GET' && request.method !== 'HEAD' && request.body)
                    ? JSON.stringify(request.body)
                    : null
            });

            const data = await response.json();
            statusCode.textContent = response.status;
            statusCode.style.color = response.ok ? 'green' : 'red';
            responseOutput.textContent = JSON.stringify(data, null, 2);
        } catch (error) {
            statusCode.textContent = 'Erreur';
            statusCode.style.color = 'red';
            responseOutput.textContent = error.message;
        }
    }

    // Bouton d'exécution
    document.getElementById('executeBtn').addEventListener('click', async function () {
        const code = Blockly.JavaScript.workspaceToCode(workspace);
        document.getElementById('generatedCode').textContent = code;

        try {
            const asyncFunc = new Function('executeRequest', `
                return (async function() {
                    ${code}
                })();
            `);

            await asyncFunc(executeRequest);
        } catch (error) {
            document.getElementById('statusCode').textContent = 'Erreur';
            document.getElementById('statusCode').style.color = 'red';
            document.getElementById('responseOutput').textContent = error.message;
        }
    });

    // Exemple de bloc initial
    const initialXml = `
    <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="http_request" x="50" y="50">
            <field name="METHOD">POST</field>
            <value name="URL">
                <block type="text">
                    <field name="TEXT">https://jsonplaceholder.typicode.com/todos</field>
                </block>
            </value>
            <statement name="HEADERS">
                <block type="set_header">
                    <field name="HEADER_NAME">Content-Type</field>
                    <value name="HEADER_VALUE">
                        <block type="text">
                            <field name="TEXT">application/json</field>
                        </block>
                    </value>
                </block>
            </statement>
            <statement name="BODY">
                <block type="set_body">
                    <value name="BODY_CONTENT">
                        <block type="text">
                            <field name="TEXT">{"userId":1,"title":"Nouveau todo","completed":false}</field>
                        </block>
                    </value>
                </block>
            </statement>
        </block>
    </xml>`;
    const initialXml2 = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="http_request" x="50" y="50">
    <field name="METHOD">DELETE</field>
    <value name="URL">
      <block type="text">
        <field name="TEXT">https://jsonplaceholder.typicode.com/todos/1</field>
      </block>
    </value>
  </block>
</xml> `

    const initialXml3 = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="http_request" x="50" y="50">
    <field name="METHOD">PUT</field>
    <value name="URL">
      <block type="text">
        <field name="TEXT">https://jsonplaceholder.typicode.com/todos/1</field>
      </block>
    </value>
    <statement name="HEADERS">
      <block type="set_header">
        <field name="HEADER_NAME">Content-Type</field>
        <value name="HEADER_VALUE">
          <block type="text">
            <field name="TEXT">application/json</field>
          </block>
        </value>
      </block>
    </statement>
    <statement name="BODY">
      <block type="set_body">
        <value name="BODY_CONTENT">
          <block type="text">
            <field name="TEXT">
              {"id":1,"title":"Todo mis à jour","completed":true,"userId":1}
            </field>
          </block>
        </value>
      </block>
    </statement>
  </block>
</xml>
 `
    Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(initialXml), workspace);
});

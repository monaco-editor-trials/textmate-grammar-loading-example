import * as monaco from 'monaco-editor';
import { loadWASM } from 'onigasm';
import { Registry } from 'monaco-textmate';
import { wireTmGrammars } from 'monaco-editor-textmate';

import './style.css';

/**
 * DBML example
 *
 * @source https://dbml.dbdiagram.io/docs/
 */
const code = `// Use DBML to define your database structure

Table follows {
  following_user_id integer
  followed_user_id integer
  created_at timestamp 
}

Table users {
  id integer [primary key]
  username varchar
  role varchar
  created_at timestamp
}

Table posts {
  id integer [primary key]
  title varchar
  body text [note: 'Content of the post']
  user_id integer
  status varchar
  created_at timestamp
}

Ref: posts.user_id > users.id // many-to-one

Ref: users.id < follows.following_user_id

Ref: users.id < follows.followed_user_id
`;

/**
 * Thanks to commenters
 *
 * Read all discussion https://github.com/zikaari/monaco-editor-textmate/issues/14
 */

(async function () {
  const editorElement = document.getElementById('editor');

  // #region Load WASM

  const onigasmResponse = await fetch(
    'https://cdn.jsdelivr.net/npm/onigasm@latest/lib/onigasm.wasm' // use for web (to prevent CORS etc.)
    // 'onigasm/lib/onigasm.wasm' // use while working on local or custom loaders (webpack, vite, etc.)
  );

  if (
    onigasmResponse.status !== 200 ||
    onigasmResponse.headers.get('content-type') !== 'application/wasm'
  ) {
    return null;
  }

  const wasmContent = await onigasmResponse.arrayBuffer();

  if (wasmContent) {
    await loadWASM(wasmContent);
  }

  // #endregion

  // #region Register Grammars

  const registry = new Registry({
    getGrammarDefinition: async (scopeName: string): Promise<any> => {
      console.log('scopeName', scopeName);

      const res: any = {
        format: 'json',
        content: await (
          await fetch('/assets/textmate/grammars/dbml.json')
        ).text(),
      };

      console.log('grammarContent', res);

      return res;
    },
  });

  const grammars = new Map();

  monaco.languages.register({ id: 'dbml' });

  grammars.set('dbml', 'source.dbml');

  console.log(grammars);

  // #endregion

  // #region Init Editor

  const editor = monaco.editor.create(editorElement!, {
    value: code,
    language: 'dbml',
    theme: 'vs-dark',
    minimap: {
      enabled: false,
    },
  });

  // #endregion

  // #region Wire Grammars

  await wireTmGrammars(monaco, registry, grammars, editor);

  // #endregion
})();

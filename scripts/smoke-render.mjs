import React from 'react';
import {renderToString} from 'react-dom/server';
import {createServer} from 'vite';

/**
 * Production startup regression guard.
 * Vite SSR transforms the real JSX source and renderToString executes every
 * initial page component. This is NOT a replacement for a browser E2E test.
 */
const vite=await createServer({
  server:{middlewareMode:true,hmr:false},
  appType:'custom',
  logLevel:'error'
});
try{
  const [{default:App},{WorkspaceProvider}]=await Promise.all([
    vite.ssrLoadModule('/src/App.jsx'),
    vite.ssrLoadModule('/src/WorkspaceContext.jsx')
  ]);
  const html=renderToString(React.createElement(WorkspaceProvider,null,React.createElement(App)));
  for(const phrase of ['CANOPY','Living','district','Evidence']){
    if(!html.toLowerCase().includes(phrase.toLowerCase())){
      throw new Error('Initial app render missing expected content: '+phrase);
    }
  }
  if(html.length<2500)throw new Error('Rendered HTML was unexpectedly empty ('+html.length+' bytes)');
  console.log('PASS: CANOPY initial React tree rendered to '+html.length+' bytes on the default workspace');
}catch(error){
  console.error('FAIL: CANOPY cannot render initial React tree:',error);
  process.exitCode=1;
}finally{
  await vite.close();
}

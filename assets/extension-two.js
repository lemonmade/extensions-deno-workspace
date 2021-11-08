shopify.extend('Checkout::Actions::RenderAfter', (
  root,
  {extension, extensionPoint}
) => {
  let runningFor = 0;
  const runningForText = root.createText(String(runningFor));
  const secondOrSeconds = root.createText('seconds');

  setInterval(() => {
    runningFor += 1;
    runningForText.updateText(runningFor.toLocaleString());
    secondOrSeconds.updateText(runningFor === 1 ? 'second' : 'seconds');
  }, 1_000);

  extension.rendered.subscribe((rendered) => {
    console.log('RENDERED', rendered);
  });

  root.appendChild(
    root.createComponent('BlockStack', {}, [
      root.createComponent(
        'TextBlock',
        {},
        `I am a ${extensionPoint} extension that has been running for `,
        root.createComponent('Text', {emphasized: true}, runningForText),
        ' ',
        secondOrSeconds,
        '!!!'
      ),
    ])
  );
});

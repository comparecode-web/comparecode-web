const originalBaseText = `Lorem ipsum dolor sit amet, consectetuer adipiscing elit.
Aenean commodo ligula eget dolor.

Aenean massa.
Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.
Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem.
Nulla consequat massa quis enim.
Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu.
	Inenim(porelementumsemper())
	Aenean vulputate eleifend tellus.
Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim.
	Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus.
Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum.
	Aenean imperdiet.
	
	Etiam ultricies nisi (vel augue.)
	
Curabitur ullamcorper ultricies nisi.
Maecenas tempus, tramba eget condimentum rhoncus, sem quam semper libero, sem neque sed ipsum.
Nam quam nunc, blandit vel, luctus pulvinar, hendrerit id, lorem.

  Lutrani funi gobro dubp polnugn.
Da batun tlen arres.
Pudbo alo pohki sermec.   `;

const modifiedBaseText = `Lorem ipsum dolor sit amet, consectetuer adipiscing elit.
Aenean commodo ligula eget dolor.

Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu.
Inenim(porjusto, rhoncus ut, imperdiet a, venenatis vitae, justo.
	Nullam dictum felis eu pede mollis pretium. Integer tincidunt.
	Cras dapibus.
	Vivamus elementumsemper() nisi.)
	Aenean vulputate eleifend tellus.
Etiam ultricies nisi (por guband.)
	
Curabitur ullamcorper ultricies nisi.

Nam eget dui.
Etiam rhoncus.
Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sem neque sed ipsum.
Nam quam nunc, blandit vel, luctus pulvinar, hendrerit id, lorem.

	Lutrani funi gobro dubp polnugn.
 Da batun tlen arres.
	Pudbo alo pohki sermec.`;

const movedSection = `Sed fringilla mauris sit amet nibh.
Donec sodales sagittis magna.
Sed consequat, leo eget bibendum sodales, augue velit cursus nunc.
Quisque malesuada placerat nisl.`;

const showcaseBefore = [
  "Vestibulum ante ipsum primis in faucibus orci luctus.",
  "Ultrices posuere cubilia curae, nullam quis ante.",
  "Etiam sit amet orci eget eros faucibus tincidunt.",
  "Duis leo, sed fringilla mauris sit amet porta.",
  "Donec vitae sapien ut libero venenatis faucibus.",
  "Nullam quis ante, etiam sit amet orci eget eros.",
  "Maecenas nec odio et ante tincidunt tempus.",
  "Phasellus blandit leo ut odio, nam commodo.",
  "Suspendisse potenti, in hac habitasse platea.",
  "Curabitur at lacus ac velit ornare lobortis."
].join("\n");

const showcaseAfter = [
  "Morbi mattis ullamcorper velit, fusce fermentum.",
  "Praesent turpis, aenean posuere tortor sed cursus.",
  "Vivamus aliquet elit ac nisl, integer ante arcu."
].join("\n");

export const originalShowcaseSection = `${showcaseBefore}
Aliquam erat volutpat, nunc eleifend leo vitae magna.
${showcaseAfter}`;

export const modifiedShowcaseSection = `${showcaseBefore}
ALIQUAM ERAT VOLUTPAT, Nunc eleifend leo vitae magna.
${showcaseAfter}`;

export const originalTestText = `${movedSection}
${originalBaseText}

${originalShowcaseSection}`;
export const modifiedTestText = `${modifiedBaseText.replace(
  "Nam quam nunc, blandit vel, luctus pulvinar, hendrerit id, lorem.\n",
  `Nam quam nunc, blandit vel, luctus pulvinar, hendrerit id, lorem.\n${movedSection}\n`
)}

${modifiedShowcaseSection}`;

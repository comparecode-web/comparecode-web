# Third-Party Notices

CompareCode's own code is licensed under [MIT](LICENSE). Dependencies, fonts, icons, and embedded libraries retain their original licenses.

The [license texts and copyright notices](public/licenses/third-party.txt) accompany the web application at `/licenses/third-party.txt`, accessible through **Settings → Open-source licenses**. Keep this file in deployments. Identical license texts are shared between their explicitly listed owners; the original copyright notices are retained.

The notices cover application libraries and their transitive dependencies, Next.js bundled notices, Material Design / Font Awesome / Ionicons artwork, the OFL fonts, KaTeX fonts, and the libraries embedded in the vendored OpenCV.js build. DOMPurify is used under its Apache-2.0 option; `diff` retains BSD-3-Clause. This does not change CompareCode's MIT license.

When updating dependencies or assets, update the affected notices from their upstream license and copyright files. Source URLs and package versions are recorded alongside the texts. The dependency-based collection retains framework and transitive notices together; it is not an assertion that every listed package appears in a browser bundle.

The hosted web application does not distribute sharp/libvips native server binaries to browsers. If a future release ships those binaries in an installer, container, or server archive, that distribution must separately satisfy their LGPL and other license obligations, including applicable corresponding-source and replacement/relinking requirements.

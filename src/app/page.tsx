import Image from "next/image";
import { Arrow } from "@/components/arrow";
import { ListeningDemo } from "@/components/listening-demo";

const platformSteps = [
  { number: "01", title: "Propor", text: "Registre o que faria diferença no intervalo." },
  { number: "02", title: "Acompanhar", text: "Veja o que está em pauta e acompanhe os próximos passos." },
  { number: "03", title: "Participar", text: "Comente, apoie e ajude a escolher o que vem depois." },
];

export default function Home() {
  return (
    <div className="landing-page">
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>

      <header className="landing-header" id="inicio">
        <a href="#inicio" className="landing-brand" aria-label="Comunica Farroupilha, início">
          <Image src="/brand/gremio-comunica.webp" width={84} height={56} alt="" priority />
          <span>comunica <strong>farroupilha</strong></span>
        </a>
        <nav className="landing-nav" aria-label="Navegação principal">
          <a href="#a-ideia">A ideia</a>
          <a href="#plataforma">A plataforma</a>
          <a href="/app" className="landing-nav-cta">Entrar <Arrow diagonal /></a>
        </nav>
      </header>

      <main id="conteudo">
        <section className="landing-hero" aria-labelledby="hero-title">
          <div className="landing-hero-copy">
            <span className="landing-kicker">COMUNICA FARROUPILHA</span>
            <h1 id="hero-title">O recreio<br />também é <em>seu.</em></h1>
            <p className="landing-hero-lead">Escutar. Propor. Fazer acontecer.</p>
            <p className="landing-hero-description">Um espaço para transformar experiências do intervalo em próximos passos.</p>
            <a href="/app" className="landing-button landing-button-orange">Entrar na conversa <Arrow /></a>
            <div className="landing-hero-meta" aria-label="Temas do projeto">
              <span>arte</span><i aria-hidden="true" /> <span>movimento</span><i aria-hidden="true" /> <span>encontro</span>
            </div>
          </div>

          <div className="landing-hero-visual">
            <div className="landing-hero-image-shell">
              <Image className="landing-hero-image" src="/landing/mural-pista.webp" alt="Quadra do Colégio Farroupilha diante de um mural colorido" fill sizes="(max-width: 800px) 92vw, 58vw" priority />
              <span className="landing-hero-image-label">O recreio em movimento</span>
            </div>
            <div className="landing-hero-sticker" aria-hidden="true"><span>uma escola</span><strong>com a nossa cara.</strong></div>
            <div className="landing-hero-rail"><span>01</span><span>onde tudo começa</span></div>
          </div>
        </section>

        <div className="landing-marquee" aria-label="Ouvir, imaginar e construir juntos">
          <div className="landing-marquee-inner"><span>Ouvir</span><b>＋</b><span>Imaginar</span><b>＋</b><span>Construir</span><b>＋</b><span>Fazer</span></div>
        </div>

        <section id="a-ideia" className="landing-story" aria-labelledby="story-title">
          <div className="landing-story-copy">
            <span className="landing-kicker">O PONTO DE PARTIDA</span>
            <h2 id="story-title">O intervalo tem muitas histórias.</h2>
            <p>Jogar, conversar, ouvir música ou respirar. Cada pessoa vive o recreio de um jeito.</p>
            <a className="landing-text-link" href="#plataforma">Entender a ideia <Arrow diagonal /></a>
          </div>

          <div className="landing-photo-grid">
            <figure className="landing-story-image landing-story-image-wide">
              <Image src="/landing/patio-geral.webp" alt="Pátio central do colégio no fim da tarde" fill sizes="(max-width: 800px) 92vw, 47vw" />
              <figcaption>Um espaço comum.<br /><strong>Muitas experiências.</strong></figcaption>
            </figure>
            <figure className="landing-story-image landing-story-image-tall">
              <Image src="/landing/mural-retrato.webp" alt="Mural colorido com um rosto e um beija-flor" fill sizes="(max-width: 800px) 68vw, 25vw" />
              <figcaption>Arte que também<br /><strong>escuta.</strong></figcaption>
            </figure>
          </div>
        </section>

        <section id="plataforma" className="landing-platform" aria-labelledby="platform-title">
          <div className="landing-platform-head">
            <div>
              <span className="landing-kicker">UMA CONVERSA QUE CONTINUA</span>
              <h2 id="platform-title">Da ideia ao<br /><em>próximo recreio.</em></h2>
            </div>
            <p>Uma plataforma simples para dar visibilidade ao que a comunidade imagina.</p>
          </div>

          <div className="landing-platform-grid">
            <div className="landing-platform-image-shell">
              <Image className="landing-platform-image" src="/landing/corredor-jogos.webp" alt="Corredor coberto do colégio com mesas de pebolim" fill sizes="(max-width: 800px) 92vw, 55vw" />
              <span className="landing-platform-image-note">O que pode acontecer<br /><strong>no intervalo?</strong></span>
            </div>
            <div className="landing-platform-copy">
              {platformSteps.map((step) => (
                <article className="landing-step" key={step.number}>
                  <span className="landing-step-number">{step.number}</span>
                  <div><h3>{step.title}</h3><p>{step.text}</p></div>
                </article>
              ))}
              <a href="/app" className="landing-button landing-button-outline">Conhecer a plataforma <Arrow /></a>
            </div>
          </div>
        </section>

        <section id="experimente" className="landing-demo-section" aria-labelledby="demo-title">
          <div className="landing-demo-head">
            <div><span className="landing-kicker">EXPERIMENTE</span><h2 id="demo-title">E se o recreio tivesse…</h2></div>
            <p>Escolha um cenário e veja a conversa começar.</p>
          </div>
          <ListeningDemo />
          <p className="landing-demo-note">Experiência ilustrativa.</p>
        </section>

        <section className="landing-closing" aria-labelledby="closing-title">
          <div className="landing-closing-image-shell">
            <Image className="landing-closing-image" src="/landing/patio-entardecer.webp" alt="Pátio do colégio ao entardecer com atividades pintadas no chão" fill sizes="100vw" />
          </div>
          <div className="landing-closing-inner">
            <div><span className="landing-kicker">O PRÓXIMO CAPÍTULO</span><h2 id="closing-title">A próxima ideia<br /><em>pode ser sua.</em></h2></div>
            <div className="landing-closing-action"><p>Entre na plataforma e participe do que vem depois.</p><a href="/app" className="landing-button landing-button-light">Entrar na plataforma <Arrow /></a></div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand"><strong>comunica farroupilha</strong><span>Um recreio com a nossa cara.</span></div>
          <div className="landing-footer-marks"><Image src="/brand/gef.png" width={48} height={48} alt="GEF — Grêmio Estudantil Farroupilha" /><a href="https://colegiofarroupilha.poa.br/" target="_blank" rel="noopener noreferrer" aria-label="Site do Colégio Farroupilha (abre em nova aba)"><Image src="/brand/farroupilha.png" width={64} height={44} alt="Colégio Farroupilha" /></a></div>
          <a className="landing-back-top" href="#inicio">Voltar ao início <Arrow diagonal /></a>
        </div>
      </footer>
    </div>
  );
}

import Image from "next/image";
import { Arrow } from "@/components/arrow";
import { ListeningDemo } from "@/components/listening-demo";

const modules = [
  { title: "Escuta e propostas", text: "Um espaço para contar como está o recreio, sugerir mudanças e opinar sobre ideias dos alunos e do próprio GEF.", detail: "Da sua experiência a uma conversa com retorno." },
  { title: "Agenda e atividades", text: "As ações confirmadas em um só lugar. O que vai acontecer, onde participar e como contar depois o que funcionou.", detail: "Da ideia combinada ao encontro no intervalo." },
  { title: "Chapas e compromissos", text: "Propostas para o lazer apresentadas com clareza e um jeito de acompanhar os compromissos da gestão eleita.", detail: "Do que foi proposto ao que está acontecendo." },
];

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <header className="site-header" id="inicio">
        <a href="#inicio" className="brand" aria-label="Grêmio Comunica Farroupilha, início">
          <Image src="/brand/gremio-comunica.webp" width={84} height={56} alt="" priority />
          <span>grêmio comunica<span className="brand-school">farroupilha</span></span>
        </a>
        <nav aria-label="Navegação principal">
          <a href="#proposta">A proposta</a>
          <a href="#como-funciona">Como vai funcionar</a>
          <a href="#experimente" className="nav-cta">Explore a ideia <Arrow diagonal /></a>
        </nav>
      </header>

      <main id="conteudo">
        <section className="hero wrap" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title">O recreio<br />também é <span>seu.</span></h1>
            <p>Mais escuta. Mais participação.<br />Um recreio com a nossa cara.</p>
            <p className="hero-description">Estamos criando um espaço para aproximar você e o GEF — e transformar o que a gente vive no intervalo em ideias para melhorar.</p>
            <a href="#experimente" className="button button-orange">Conheça a proposta <Arrow /></a>
          </div>
          <div className="hero-art">
            <Image className="hero-logo" src="/brand/gremio-comunica.webp" alt="Logo do Grêmio Comunica: um megafone laranja com as letras GEF dentro de um balão de conversa" width={1536} height={1024} sizes="(max-width: 700px) 90vw, 48vw" priority />
            <p className="art-caption">Sua voz faz parte<br /><strong>dessa conversa.</strong></p>
          </div>
          <div className="hero-foot"><span>Uma proposta para o Grêmio Estudantil Farroupilha</span><a href="#proposta">Vem entender <Arrow /></a></div>
        </section>

        <div className="statement" aria-label="Ouvir, construir juntos e fazer acontecer">
          <div className="wrap statement-inner"><span>Ouvir.</span><Arrow /><span>Construir juntos.</span><Arrow /><span>Fazer acontecer.</span></div>
        </div>

        <section id="proposta" className="proposal wrap section-space" aria-labelledby="proposal-title">
          <h2 id="proposal-title">Um intervalo.<br /><span>Muitas formas<br />de aproveitar.</span></h2>
          <div className="proposal-copy">
            <p className="lead">Jogar, conversar, ouvir música ou só dar uma pausa. Cada aluno vive o recreio de um jeito.</p>
            <p>Antes de decidir o que mudar, precisamos ouvir o que está bom, o que incomoda e o que ainda faz falta. É para isso que nasce o Grêmio Comunica Farroupilha.</p>
            <p>A proposta é abrir essa conversa nos dois sentidos: você traz experiências e sugestões, o GEF apresenta ideias, e todo mundo pode ajudar a pensar os próximos passos.</p>
            <a className="text-link" href="#experimente">Veja como essa escuta pode acontecer <Arrow diagonal /></a>
          </div>
        </section>

        <section id="experimente" className="listening-section section-space" aria-labelledby="listening-title">
          <div className="wrap">
            <div className="section-intro"><h2 id="listening-title">E se o próximo<br />recreio tivesse…</h2><p>Escolha uma possibilidade e veja como uma ideia pode abrir espaço para diferentes vozes.</p></div>
            <ListeningDemo />
            <p className="demo-disclaimer">Demonstração da proposta. Os cenários são ilustrativos; nenhuma resposta é enviada ou armazenada.</p>
          </div>
        </section>

        <section id="como-funciona" className="modules wrap section-space" aria-labelledby="modules-title">
          <div className="section-intro"><h2 id="modules-title">A conversa continua<br /><span>fora da caixa de ideias.</span></h2><p>Três frentes planejadas para conectar a escuta ao que acontece no colégio.</p></div>
          <div className="module-list">{modules.map((module) => <article className="module-row" key={module.title}><h3>{module.title}</h3><p>{module.text}</p><span>{module.detail}</span></article>)}</div>
        </section>

        <section className="closing" aria-labelledby="closing-title">
          <div className="wrap closing-inner"><div><h2 id="closing-title">O primeiro passo<br />é dar voz.</h2><p>Estamos começando pelo que mais importa: criar um caminho para ouvir os alunos e pensar o lazer junto com o GEF.</p></div><div className="closing-status"><span className="status"><span aria-hidden="true" /> Projeto em desenvolvimento</span><p>Esta é a apresentação da plataforma.<br />Os espaços de participação chegam nas próximas etapas.</p><a className="button button-light" href="#experimente">Explorar a proposta <Arrow /></a></div></div>
        </section>
      </main>

      <footer className="site-footer wrap">
        <div className="footer-name"><strong>grêmio comunica farroupilha</strong><span>Um recreio com a nossa cara.</span></div>
        <div className="institutional"><Image src="/brand/gef.png" width={48} height={48} alt="GEF — Grêmio Estudantil Farroupilha" /><a href="https://colegiofarroupilha.poa.br/" target="_blank" rel="noopener noreferrer" aria-label="Site do Colégio Farroupilha (abre em nova aba)"><Image src="/brand/farroupilha.png" width={64} height={44} alt="Colégio Farroupilha" /></a></div>
        <a className="back-top" href="#inicio">Voltar ao início <Arrow diagonal /></a>
      </footer>
    </>
  );
}

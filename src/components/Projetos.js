// src/components/Projetos.js
import React, { useEffect, useState } from "react";
import API from "../Application";
import "./Projetos.css";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

function Projetos() {
  const [projetos, setProjetos] = useState([]);
  const hoje = new Date();
  const daquiUmMes = new Date();
  daquiUmMes.setMonth(hoje.getMonth() + 1);

  const formatarData = (date) => date.toISOString().split("T")[0];

  const [form, setForm] = useState({
    id: null,
    nome: "",
    descricao: "",
    dataInicio: formatarData(hoje),
    dataFim: formatarData(daquiUmMes),
    status: "NAO_INICIADO",
    arquivo: null
  });

  const [erroNome, setErroNome] = useState("");

  useEffect(() => {
    listarProjetos();
  }, []);

  const listarProjetos = async () => {
    try {
      const res = await API.get("/projetos");
      setProjetos(res.data);
    } catch (err) {
      console.error("Erro ao listar projetos:", err);
    }
  };

  const verificarNomeDuplicado = (nome) => {
    const existe = projetos.some(
      (p) => p.nome.toLowerCase() === nome.toLowerCase() && p.id !== form.id
    );
    if (existe) {
      setErroNome("Nome já existe! Escolha outro.");
      return true;
    } else {
      setErroNome("");
      return false;
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "arquivo") {
      setForm({ ...form, arquivo: files[0] });
    } else {
      if (name === "nome") verificarNomeDuplicado(value);
      setForm({ ...form, [name]: value });
    }
  };

  const corrigirAno = (e, campo) => {
    let v = e.target.value;
    if (v) {
      let [ano, mes, dia] = v.split("-");
      if (ano) {
        ano = ano.slice(0, 4);
        let anoNum = parseInt(ano, 10);
        if (isNaN(anoNum) || anoNum < 1900) ano = "1900";
        else if (anoNum > 9000) ano = "9000";
      }
      v = [ano, mes, dia].filter(Boolean).join("-");
    }
    setForm({ ...form, [campo]: v });
  };

  const salvarProjeto = async (e) => {
    e.preventDefault();
    if (verificarNomeDuplicado(form.nome)) return;

    if (new Date(form.dataFim) < new Date(form.dataInicio)) {
      alert("A data final não pode ser menor que a data de início.");
      return;
    }

    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null) data.append(key, value);
      });

      await API.post("/projetos", data);

      setForm({
        id: null,
        nome: "",
        descricao: "",
        dataInicio: formatarData(hoje),
        dataFim: formatarData(daquiUmMes),
        status: "NAO_INICIADO",
        arquivo: null
      });

      listarProjetos();
    } catch (err) {
      console.error("Erro ao salvar projeto:", err);
      alert("Erro ao salvar projeto.");
    }
  };

  const editarProjeto = (projeto) => {
    setForm({
      id: projeto.id,
      nome: projeto.nome,
      descricao: projeto.descricao,
      dataInicio: projeto.dataInicio ? projeto.dataInicio : formatarData(hoje),
      dataFim: projeto.dataFim ? projeto.dataFim : formatarData(daquiUmMes),
      status: projeto.status,
      arquivo: null
    });
  };

  const baixarArquivo = async (nomeArquivo) => {
    try {
      const res = await API.get(`/projetos/baixar?nomeArquivo=${encodeURIComponent(nomeArquivo)}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", nomeArquivo);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Erro ao baixar arquivo:", err);
      alert("Não foi possível baixar o arquivo.");
    }
  };

  const removerArquivo = async (nome) => {
    try {
      await API.delete(`/projetos/arquivo?nome=${encodeURIComponent(nome)}`);
      listarProjetos();
    } catch (err) {
      console.error("Erro ao remover arquivo:", err);
      alert("Não foi possível remover o arquivo.");
    }
  };

  const deletarProjeto = async (nome) => {
    try {
      await API.delete(`/projetos?nome=${encodeURIComponent(nome)}`);
      listarProjetos();
    } catch (err) {
      console.error("Erro ao deletar projeto:", err);
      alert("Não foi possível deletar o projeto.");
    }
  };

  return (
    <div className="container">
      <h1>Projetos</h1>
      <form className="form" onSubmit={salvarProjeto}>
        <input
          type="text"
          name="nome"
          placeholder="Nome do projeto"
          value={form.nome}
          onChange={handleChange}
          required
        />
        {erroNome && <span className="erro">{erroNome}</span>}

        <textarea
          name="descricao"
          placeholder="Descrição"
          value={form.descricao}
          onChange={handleChange}
          required
        />

        <div className="datas">
          <label>
            Data de Início
            <input
              type="date"
              name="dataInicio"
              value={form.dataInicio}
              onBlur={(e) => corrigirAno(e, "dataInicio")}
              onChange={handleChange}
              min="1900-01-01"
              max="9000-12-31"
              required
            />
          </label>

          <label>
            Data Prazo / Final
            <input
              type="date"
              name="dataFim"
              value={form.dataFim}
              onBlur={(e) => corrigirAno(e, "dataFim")}
              onChange={handleChange}
              min="1900-01-01"
              max="9000-12-31"
              required
            />
          </label>
        </div>

        <select name="status" value={form.status} onChange={handleChange}>
          <option value="NAO_INICIADO">Não iniciado</option>
          <option value="PLANEJADO">Planejado</option>
          <option value="EM_ANDAMENTO">Em andamento</option>
          <option value="ATRASADO">Atrasado</option>
          <option value="CONCLUIDO">Concluído</option>
        </select>

        {/* Campo de arquivo com nome dentro do botão e X circular */}
        <div className="arquivo-atual">
          <label className="file-label" htmlFor="arquivo">
            {form.arquivo ? form.arquivo.name : "Escolher arquivo"}
          </label>
          <input
            type="file"
            name="arquivo"
            id="arquivo"
            onChange={handleChange}
          />
          {form.arquivo && (
            <button
              type="button"
              onClick={() => setForm({ ...form, arquivo: null })}
            >
              ×
            </button>
          )}
        </div>

        {form.arquivo && (
          <button
            type="button"
            className="visualizar-arquivo"
            onClick={() => window.open(URL.createObjectURL(form.arquivo))}
          >
            Visualizar Arquivo
          </button>
        )}

        <button type="submit" disabled={erroNome !== ""}>
          {form.id ? "Atualizar" : "Salvar"}
        </button>
      </form>

      <div className="lista">
        {projetos.map((p) => (
          <div key={p.id} className="card">
            <h3>{p.nome}</h3>
            <p>{p.descricao}</p>
            <p>
              {p.dataInicio
                ? format(parseISO(p.dataInicio), "dd/MM/yyyy", { locale: ptBR })
                : "-"}{" "}
              a{" "}
              {p.dataFim
                ? format(parseISO(p.dataFim), "dd/MM/yyyy", { locale: ptBR })
                : "-"}
            </p>
            <p>Status: {p.status}</p>

            {p.nomeArquivo && (
              <div className="arquivo-card">
                <span>Arquivo: {p.nomeArquivo}</span>
                <button onClick={() => baixarArquivo(p.nomeArquivo)}>Baixar</button>
                <button onClick={() => removerArquivo(p.nome)}>Remover</button>
              </div>
            )}

            <button onClick={() => editarProjeto(p)}>Editar</button>
            <button onClick={() => deletarProjeto(p.nome)}>Deletar Projeto</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Projetos;

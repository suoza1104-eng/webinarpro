# Acesso SSH no VS Code para professoremersonleite.site

Este projeto pode reaproveitar o acesso SSH que ja existe neste computador.

Importante: nao copie a chave privada para dentro do projeto. O correto e deixar a chave em `C:\Users\Emerson\.ssh\` e referenciar essa chave pelo arquivo `C:\Users\Emerson\.ssh\config`.

## Alias SSH disponivel

O alias abaixo ja esta configurado neste computador:

```sshconfig
Host firepay-site
    HostName professoremersonleite.site
    User root
    Port 22022
    IdentityFile C:/Users/Emerson/.ssh/codex_firepay_site_bridge
    IdentitiesOnly yes
```

Com isso, o VS Code, o terminal e scripts de deploy podem usar apenas:

```powershell
ssh firepay-site
```

## Teste rapido do acesso

No PowerShell:

```powershell
ssh firepay-site "hostname && pwd"
```

Se aparecer o nome do servidor e `/root`, o acesso esta funcionando.

## Como usar no VS Code

1. Instale a extensao **Remote - SSH** no VS Code.
2. Abra a paleta de comandos com `Ctrl+Shift+P`.
3. Execute **Remote-SSH: Connect to Host...**.
4. Escolha `firepay-site`.
5. Depois de conectado, abra a pasta do projeto no servidor.

Sugestao de pasta para o novo projeto:

```text
/home/professoremersonleite/apps/novo-projeto
```

Ou, se o site for servido por cPanel/Apache, pode ser algo como:

```text
/home/profess/public_html/novo-projeto
```

Confirme a estrutura real do servidor antes de publicar arquivos finais.

## Criar a pasta do novo projeto no servidor

Exemplo:

```powershell
ssh firepay-site "mkdir -p /home/professoremersonleite/apps/novo-projeto"
```

## Copiar arquivos para o servidor

Para enviar a pasta atual para o servidor usando `scp`:

```powershell
scp -r .\* firepay-site:/home/professoremersonleite/apps/novo-projeto/
```

Para sincronizar melhor, se `rsync` estiver disponivel no Windows:

```powershell
rsync -avz --delete ./ firepay-site:/home/professoremersonleite/apps/novo-projeto/
```

## Usar Git no servidor

Se o novo projeto estiver em um repositorio Git:

```powershell
ssh firepay-site
cd /home/professoremersonleite/apps
git clone URL_DO_REPOSITORIO novo-projeto
```

Depois, para atualizar:

```powershell
ssh firepay-site "cd /home/professoremersonleite/apps/novo-projeto && git pull"
```

## Arquivo .vscode recomendado no projeto local

Voce pode criar `.vscode/settings.json` no novo projeto com:

```json
{
  "remote.SSH.defaultHost": "firepay-site"
}
```

Isso nao guarda senha nem chave privada. Ele apenas aponta o VS Code para o alias SSH ja existente.

## Observacao sobre o dominio

O SSH local esta configurado para `professoremersonleite.site`.

Se o novo projeto for em `professoremersonliete.site`, com `liete`, confirme se esse dominio existe mesmo ou se foi apenas inversao das letras `ei`.

## O que pode ser automatizado depois

Podemos criar no novo projeto:

- `.vscode/settings.json` apontando para `firepay-site`.
- Um script `deploy.ps1` para publicar no servidor.
- Um `.cpanel.yml` se o deploy for feito pelo Git/cPanel.
- Um setup inicial no servidor com pasta, permissao, dominio/subdominio e build.


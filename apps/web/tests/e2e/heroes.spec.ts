import { test, expect } from './fixtures';

test('cria, visualiza, edita, inativa e reativa um herói', async ({ page, heroApi: _heroApi }) => {
  const nickname = `Vendaval E2E ${Date.now()}`;

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Heróis' })).toBeVisible();

  await page.getByRole('button', { name: 'Criar herói' }).click();
  const createDialog = page.getByRole('dialog', { name: /Criar herói/ });
  await createDialog.getByLabel('Nome').fill('Lia Vento');
  await createDialog.getByLabel('Apelido').fill(nickname);
  await createDialog.getByLabel('Data de nascimento').fill('1993-05-10');
  await createDialog.getByLabel('Universo').fill('Aurora');
  await createDialog.getByLabel('Poder principal').fill('Controle do vento');
  await createDialog
    .getByLabel('URL do avatar')
    .fill('https://api.dicebear.com/9.x/adventurer/svg?seed=VendavalE2E');
  await createDialog.getByRole('button', { name: 'Criar herói' }).click();
  await expect(page.getByText('Herói criado com sucesso.')).toBeVisible();
  await expect(page.getByText(nickname, { exact: true })).toBeVisible();

  await page.getByRole('button', { name: `Ver detalhes de ${nickname}` }).click();
  await expect(page.getByRole('dialog', { name: 'Detalhes do herói' })).toContainText(
    'Controle do vento',
  );
  await page.getByRole('button', { name: 'Fechar' }).click();

  await page.getByRole('button', { name: `Ações de ${nickname}` }).click();
  await page.getByRole('menuitem', { name: 'Editar' }).click();
  const editDialog = page.getByRole('dialog', { name: /Editar herói/ });
  await editDialog.getByLabel('Poder principal').fill('Controle do clima');
  await editDialog.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByText('Herói atualizado com sucesso.')).toBeVisible();

  await page.getByRole('button', { name: `Ver detalhes de ${nickname}` }).click();
  const updatedDetails = page.getByRole('dialog', { name: 'Detalhes do herói' });
  await expect(updatedDetails).toContainText('Controle do clima');
  await updatedDetails.getByRole('button', { name: 'Fechar' }).click();

  await page.getByRole('button', { name: `Ações de ${nickname}` }).click();
  await page.getByRole('menuitem', { name: 'Excluir' }).click();
  await page
    .getByRole('dialog', { name: 'Excluir herói?' })
    .getByRole('button', { name: 'Excluir' })
    .click();
  await expect(page.getByText('Herói excluído e mantido como inativo.')).toBeVisible();

  await page.getByRole('button', { name: `Ações de ${nickname}` }).click();
  await page.getByRole('menuitem', { name: 'Ativar' }).click();
  await page
    .getByRole('dialog', { name: 'Ativar herói?' })
    .getByRole('button', { name: 'Ativar' })
    .click();
  await expect(page.getByText('Herói ativado com sucesso.')).toBeVisible();
});

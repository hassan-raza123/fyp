import { test, expect } from '@playwright/test';
import { statePath, readSeededIds } from '../support/global-setup';
import { apiPost } from '../support/api-helper';
import { testDb } from '../support/fixtures';

/**
 * External survey access.
 *
 * Alumni and employers have no account, so two survey endpoints are reachable
 * without a session. What is supposed to make that safe is the survey's
 * `publicToken` — 32 random bytes, delivered in the invitation email, and the
 * only thing between the survey and the open internet.
 *
 * Two things were wrong, and the survey subsystem had no test coverage at all,
 * which is why neither was noticed:
 *
 *   - `POST /api/surveys/[id]/public` *mints* that token and checked nothing,
 *     while `proxy.ts` listed the path as public. Anyone could ask for the
 *     token of any survey by id.
 *   - `POST /api/surveys/[id]/external-respond` never looked at the token at
 *     all. The survey id is a small integer, so responses could be stuffed into
 *     any active alumni or employer survey by walking ids.
 *
 * Survey answers are averaged into indirect PLO attainment, so both ended at
 * the same place: an anonymous caller moving an accreditation figure.
 */

const ids = readSeededIds();

let surveyId: number;
let publicToken: string;

test.beforeAll(async () => {
  const creator = await testDb.users.findFirstOrThrow({
    where: { email: 'e2e.admin@test.local' },
    select: { id: true },
  });

  const survey = await testDb.surveys.create({
    data: {
      title: 'Employer feedback (access spec)',
      description: 'Fixture for the external-access tests',
      type: 'employer',
      status: 'active',
      programId: ids.programId,
      createdBy: creator.id,
      publicToken: 'access-spec-token-do-not-guess',
      updatedAt: new Date(),
    },
  });

  surveyId = survey.id;
  publicToken = survey.publicToken!;
});

test.afterAll(async () => {
  await testDb.survey_answers.deleteMany({
    where: { response: { surveyId } },
  });
  await testDb.survey_responses.deleteMany({ where: { surveyId } });
  await testDb.survey_questions.deleteMany({ where: { surveyId } });
  await testDb.surveys.deleteMany({ where: { id: surveyId } });
});

test.describe('An anonymous caller', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('cannot mint a survey public link token', async ({ page, baseURL }) => {
    await page.goto('/');

    const response = await page.request.post(
      `${baseURL}/api/surveys/${surveyId}/public`
    );

    expect(
      response.status(),
      'an anonymous caller obtained a survey link token'
    ).not.toBe(200);
  });

  test('cannot submit a response without the token', async ({
    page,
    baseURL,
  }) => {
    await page.goto('/');

    const response = await page.request.post(
      `${baseURL}/api/surveys/${surveyId}/external-respond`,
      {
        data: {
          respondentName: 'Nobody',
          respondentEmail: 'nobody@example.com',
          answers: [],
        },
      }
    );

    expect(
      response.status(),
      'a response was accepted with no survey link token'
    ).not.toBe(200);

    const stuffed = await testDb.survey_responses.count({ where: { surveyId } });
    expect(stuffed, 'a survey response was recorded anyway').toBe(0);
  });

  test('cannot read the survey without the token', async ({
    page,
    baseURL,
  }) => {
    await page.goto('/');

    const response = await page.request.get(
      `${baseURL}/api/surveys/${surveyId}/external-respond`
    );

    expect(response.status()).not.toBe(200);
  });

  /**
   * The token is the credential, so holding it must still work — otherwise the
   * fix has simply broken the feature for the people it exists for.
   */
  test('can read the survey when it holds the token', async ({
    page,
    baseURL,
  }) => {
    await page.goto('/');

    const response = await page.request.get(
      `${baseURL}/api/surveys/${surveyId}/external-respond?token=${publicToken}`
    );

    expect(
      response.status(),
      'a legitimate respondent with the link was refused'
    ).toBe(200);
  });

  test('a wrong token is refused', async ({ page, baseURL }) => {
    await page.goto('/');

    const response = await page.request.get(
      `${baseURL}/api/surveys/${surveyId}/external-respond?token=not-the-token`
    );

    expect(response.status()).toBe(404);
  });
});

test.describe('A department admin', () => {
  test.use({ storageState: statePath('admin') });

  test('can mint the survey link token', async ({ page }) => {
    await page.goto('/admin');

    const response = await apiPost(
      page,
      `/api/surveys/${surveyId}/public`,
      {}
    );

    expect(
      response.status,
      'staff can no longer generate the link they are meant to send out'
    ).toBe(200);
  });
});

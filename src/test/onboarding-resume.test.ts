import { resumeStep } from '@/lib/permissions';
describe('onboarding resume', () => {
  it('resumes at the saved step', () => expect(resumeStep(2, 4)).toBe(2));
  it('starts at welcome when nothing saved', () => expect(resumeStep(undefined, 4)).toBe(0));
  it('ignores out-of-range steps', () => expect(resumeStep(7, 4)).toBe(0));
});
import { ONBOARDING_STEPS } from '@/components/onboarding';
describe('two-page onboarding', () => {
  it('has exactly two pages', () => expect(ONBOARDING_STEPS.length).toBe(2));
  it('a step saved from the old 4-page tour restarts at welcome', () => expect(resumeStep(3, ONBOARDING_STEPS.length)).toBe(0));
});

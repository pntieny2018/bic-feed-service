import { Test, TestingModule } from '@nestjs/testing';
import { CanReadTimelineConstraint } from '../validations/decorators';
import { UserService } from '../../../shared/user';
import { SentryService } from '@app/sentry';

describe('CanReadTimelineConstraint', () => {
  let decorator;
  let userService;
  let sentryService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CanReadTimelineConstraint,
        {
          provide: UserService,
          useValue: {
            get: jest.fn()
          }
        },
        {
          provide: SentryService,
          useValue: {
            captureException: jest.fn()
          }
        },
      ]
    }).compile();

    decorator = module.get<CanReadTimelineConstraint>(CanReadTimelineConstraint);
    userService = module.get<UserService>(UserService);
    sentryService = module.get<SentryService>(SentryService);
  })

  describe('CanReadTimelineConstraint.validate', () => {
    it('should success if have valid value', async () => {
      userService.get.mockResolvedValue({groups: [1]})
      const isValid = await decorator.validate(1, {object: {user: {id: 1}}})
      expect(userService.get).toBeCalled()
      expect(isValid).toEqual(true)
    });
    it('should fail if cannot userService cannot get', async () => {
      const errorMessage = 'error'
      userService.get.mockRejectedValue(new Error(errorMessage))
      try {
        const isValid = await decorator.validate(1, {object: {user: {id: 1}}})
        expect(isValid).toEqual(false)
        expect(userService.get).toBeCalled()
        expect(sentryService.captureException).toBeCalled()
      } catch (e) {

      }
    });
  })

})

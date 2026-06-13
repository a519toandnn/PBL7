import { ForbiddenException } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRole, UserStatus } from './entities/user.entity';

describe('UserService admin protections', () => {
  const createService = (existingUser: any) => {
    const userRepository = {
      findOne: jest.fn(({ where }) => {
        if (where?.id === existingUser.id) {
          return Promise.resolve(existingUser);
        }

        return Promise.resolve(null);
      }),
      save: jest.fn((user) => Promise.resolve(user)),
    };

    const service = new UserService(userRepository as any);

    return { service, userRepository };
  };

  it('rejects role updates for existing admin accounts', async () => {
    const { service, userRepository } = createService({
      id: 1,
      full_name: 'Root Admin',
      email: 'root@example.com',
      phone: null,
      password_hash: 'hash',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });

    await expect(service.update(1, { role: UserRole.CUSTOMER })).rejects.toThrow(
      ForbiddenException,
    );
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('rejects status updates for existing admin accounts', async () => {
    const { service, userRepository } = createService({
      id: 1,
      full_name: 'Root Admin',
      email: 'root@example.com',
      phone: null,
      password_hash: 'hash',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });

    await expect(service.update(1, { status: UserStatus.LOCKED })).rejects.toThrow(
      ForbiddenException,
    );
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('still allows admins to update customer role and status', async () => {
    const { service, userRepository } = createService({
      id: 2,
      full_name: 'Regular Customer',
      email: 'customer@example.com',
      phone: null,
      password_hash: 'hash',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
    });

    await expect(
      service.update(2, { role: UserRole.ADMIN, status: UserStatus.LOCKED }),
    ).resolves.toMatchObject({
      role: UserRole.ADMIN,
      status: UserStatus.LOCKED,
    });
    expect(userRepository.save).toHaveBeenCalledTimes(1);
  });
});

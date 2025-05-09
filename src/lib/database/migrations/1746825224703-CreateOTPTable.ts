import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOTPTable1746825224703 implements MigrationInterface {
  name = 'CreateOTPTable1746825224703';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`otp\` (\`id\` int NOT NULL AUTO_INCREMENT, \`email\` varchar(255) NOT NULL, \`userType\` varchar(255) NOT NULL, \`code\` varchar(255) NOT NULL, \`expiresAt\` datetime NOT NULL, \`isUsed\` tinyint NOT NULL DEFAULT 0, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`email_userType\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_otp_email_userType\` ON \`otp\` (\`email_userType\`)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`IDX_otp_email_userType\` ON \`otp\``);
    await queryRunner.query(`DROP TABLE \`otp\``);
  }
}

/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  BeneficiaryContribution,
  BeneficiaryVault,
  Dapper,
  Stake,
  Vault,
} from "generated";

Dapper.Initialized.handler(async ({ event, context }) => {
  const vault: Vault = {
    id: event.srcAddress,
    depositToken: event.params.depositToken,
    interestRateBps: event.params.interestRateBps,
    beneficiaryVault_id: event.params.beneficiaryVault,
    yieldVault: event.params.yieldVault,
    currentAmountLocked: BigInt(0),
    lifetimeValueLocked: BigInt(0),
    lifetimeInterestPaid: BigInt(0),
  };

  const beneficiaryVault: BeneficiaryVault = {
    id: event.params.beneficiaryVault,
    tokenAddress: event.params.depositToken,
    lifetimeValueContributed: BigInt(0),
  };

  context.Vault.set(vault);
  context.BeneficiaryVault.set(beneficiaryVault);
});

Dapper.Staked.handler(async ({ event, context }) => {
  let vault = await context.Vault.get(event.srcAddress);
  let user = await context.User.get(event.params.user);
  if (!user) {
    user = {
      id: event.params.user,
      address: event.params.user,
    };
    context.User.set(user);
  }

  if (!vault) {
    throw new Error(`Vault not found: ${event.srcAddress}`);
  }
  const stake: Stake = {
    id: `${event.srcAddress}-${event.params.stakeId}`,
    stakeId: event.params.stakeId,
    user_id: event.params.user,
    amountStaked: event.params.amountStaked,
    depositTimestamp: event.block.timestamp,
    interestPaid: event.params.interestPaid,
    lockDuration: event.params.lockDuration,
    unlockTimestamp: event.params.unlockTimestamp,
    withdrawTimestamp: undefined,
    depositTxHash: event.transaction.hash,
    withdrawTxHash: undefined,
    tokenAddress: vault.depositToken,
    vaultAddress: event.srcAddress,
  };

  vault = {
    ...vault,
    currentAmountLocked: vault.currentAmountLocked + event.params.amountStaked,
    lifetimeValueLocked: vault.lifetimeValueLocked + event.params.amountStaked,
    lifetimeInterestPaid:
      vault.lifetimeInterestPaid + event.params.interestPaid,
  };

  context.Vault.set(vault);
  context.Stake.set(stake);
});

Dapper.Unstaked.handler(async ({ event, context }) => {
  let vault = await context.Vault.get(event.srcAddress);
  let stake = await context.Stake.get(
    `${event.srcAddress}-${event.params.stakeId}`
  );
  if (!vault) {
    throw new Error(`Vault not found: ${event.srcAddress}`);
  }

  if (!stake) {
    throw new Error(
      `Stake not found: ${event.srcAddress}-${event.params.stakeId}`
    );
  }

  let beneficiaryVault = await context.BeneficiaryVault.get(
    vault.beneficiaryVault_id
  );

  if (!beneficiaryVault) {
    throw new Error(
      `Beneficiary vault not found: ${vault.beneficiaryVault_id}`
    );
  }

  vault = {
    ...vault,
    currentAmountLocked: vault.currentAmountLocked - stake.amountStaked,
  };

  stake = {
    ...stake,
    withdrawTimestamp: event.block.timestamp,
    withdrawTxHash: event.transaction.hash,
  };

  beneficiaryVault = {
    ...beneficiaryVault,
    lifetimeValueContributed:
      beneficiaryVault.lifetimeValueContributed + event.params.feeGenerated,
  };

  const newContribution: BeneficiaryContribution = {
    id: stake.id,
    beneficiaryVault_id: beneficiaryVault.id,
    stake_id: stake.id,
    amount: event.params.feeGenerated,
    contributionTimestamp: event.block.timestamp,
    contributionTxHash: event.transaction.hash,
  };

  context.Vault.set(vault);
  context.Stake.set(stake);
  context.BeneficiaryVault.set(beneficiaryVault);
  context.BeneficiaryContribution.set(newContribution);
});

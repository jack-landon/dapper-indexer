import assert from "assert";
import { 
  TestHelpers,
  Dapper_Approval
} from "generated";
const { MockDb, Dapper } = TestHelpers;

describe("Dapper contract Approval event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for Dapper contract Approval event
  const event = Dapper.Approval.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("Dapper_Approval is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await Dapper.Approval.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualDapperApproval = mockDbUpdated.entities.Dapper_Approval.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedDapperApproval: Dapper_Approval = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      owner: event.params.owner,
      spender: event.params.spender,
      value: event.params.value,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualDapperApproval, expectedDapperApproval, "Actual DapperApproval should be the same as the expectedDapperApproval");
  });
});

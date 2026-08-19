export const typeDefs = /* GraphQL */ `
  scalar JSON

  type PromptVersion {
    id: ID!
    promptId: ID!
    versionNumber: Int!
    template: String!
    variables: [String!]!
    modelConfig: JSON
    createdAt: String!
  }

  type Prompt {
    id: ID!
    slug: String!
    name: String!
    activeVersionId: ID
    createdAt: String!
    activeVersion: PromptVersion
    versions: [PromptVersion!]!
  }

  type AssignedVersion {
    version: PromptVersion!
    experimentId: ID
    variant: String
  }

  type Experiment {
    id: ID!
    promptId: ID!
    variantAVersionId: ID!
    variantBVersionId: ID!
    splitRatio: Float!
    status: String!
    createdAt: String!
  }

  type Query {
    prompt(slug: String!): Prompt
    promptVersions(promptId: ID!): [PromptVersion!]!
    assignedVersion(promptId: ID!, subjectId: String!): AssignedVersion!
  }

  type Mutation {
    createPrompt(slug: String!, name: String!): Prompt!
    createVersion(
      promptId: ID!
      template: String!
      variables: [String!]
      modelConfig: JSON
    ): PromptVersion!
    activateVersion(promptId: ID!, versionId: ID!): Prompt!
    createExperiment(
      promptId: ID!
      variantAVersionId: ID!
      variantBVersionId: ID!
      splitRatio: Float
    ): Experiment!
    stopExperiment(experimentId: ID!): Experiment!
  }
`;
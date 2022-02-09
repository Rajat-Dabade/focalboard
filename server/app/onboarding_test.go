package app

import (
	"fmt"
	"github.com/golang/mock/gomock"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestPrepareOnboardingTour(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	t.Run("base case", func(t *testing.T) {
		welcomeBoard := model.Block{
			ID:    "block_id_1",
			Type:  model.TypeBoard,
			Title: "Welcome to Boards!",
			Fields: map[string]interface{}{
				"isTemplate": true,
			},
		}
		th.Store.EXPECT().GetSubTree3(store.Container{WorkspaceID: "0"}, "buixxjic3xjfkieees4iafdrznc", gomock.Any()).Return([]model.Block{welcomeBoard}, nil)

		th.Store.EXPECT().InsertBlock(store.Container{WorkspaceID: "workspace_id_1"}, gomock.Any(), "user_id_1").Return(nil)

		th.Store.EXPECT().CreatePrivateWorkspace("user_id_1").Return("workspace_id_1", nil)

		userPropPatch := model.UserPropPatch{
			UpdatedFields: map[string]interface{}{
				KeyOnboardingTourStarted:  true,
				KeyOnboardingTourStep:     ValueOnboardingFirstStep,
				KeyOnboardingTourCategory: ValueTourCategoryOnboarding,
			},
		}

		th.Store.EXPECT().PatchUserProps("user_id_1", userPropPatch).Return(nil)

		workspaceId, boardID, err := th.App.PrepareOnboardingTour("user_id_1")
		assert.NoError(t, err)
		assert.Equal(t, "workspace_id_1", workspaceId)
		assert.NotEmpty(t, boardID)

		fmt.Println(fmt.Sprintf("workspaceId: %s", workspaceId))
		fmt.Println(fmt.Sprintf("boardID: %s", boardID))
	})
}

func TestCreateWelcomeBoard(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	t.Run("base case", func(t *testing.T) {
		welcomeBoard := model.Block{
			ID:    "block_id_1",
			Type:  model.TypeBoard,
			Title: "Welcome to Boards!",
			Fields: map[string]interface{}{
				"isTemplate": true,
			},
		}
		th.Store.EXPECT().GetSubTree3(store.Container{WorkspaceID: "0"}, "buixxjic3xjfkieees4iafdrznc", gomock.Any()).Return([]model.Block{welcomeBoard}, nil)

		th.Store.EXPECT().InsertBlock(store.Container{WorkspaceID: "workspace_id_1"}, gomock.Any(), "user_id_1").Return(nil)

		boardID, err := th.App.createWelcomeBoard("user_id_1", "workspace_id_1")
		assert.Nil(t, err)
		assert.NotEmpty(t, boardID)
	})

	t.Run("template doesn't contain a board", func(t *testing.T) {
		welcomeBoard := model.Block{
			ID:    "block_id_1",
			Type:  model.TypeComment,
			Title: "Welcome to Boards!",
		}
		th.Store.EXPECT().GetSubTree3(store.Container{WorkspaceID: "0"}, "buixxjic3xjfkieees4iafdrznc", gomock.Any()).Return([]model.Block{welcomeBoard}, nil)

		th.Store.EXPECT().InsertBlock(store.Container{WorkspaceID: "workspace_id_1"}, gomock.Any(), "user_id_1").Return(nil)

		boardID, err := th.App.createWelcomeBoard("user_id_1", "workspace_id_1")
		assert.Error(t, err)
		assert.Empty(t, boardID)
	})

	t.Run("template doesn't contain the welcome board", func(t *testing.T) {
		welcomeBoard := model.Block{
			ID:    "block_id_1",
			Type:  model.TypeBoard,
			Title: "Jean luc Picard",
			Fields: map[string]interface{}{
				"isTemplate": true,
			},
		}
		th.Store.EXPECT().GetSubTree3(store.Container{WorkspaceID: "0"}, "buixxjic3xjfkieees4iafdrznc", gomock.Any()).Return([]model.Block{welcomeBoard}, nil)

		th.Store.EXPECT().InsertBlock(store.Container{WorkspaceID: "workspace_id_1"}, gomock.Any(), "user_id_1").Return(nil)

		boardID, err := th.App.createWelcomeBoard("user_id_1", "workspace_id_1")
		assert.Error(t, err)
		assert.Empty(t, boardID)
	})
}
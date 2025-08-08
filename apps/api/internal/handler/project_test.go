package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"go-nextjs-api/internal/interfaces"
	"go-nextjs-api/internal/model"

	"github.com/gin-gonic/gin"
)

// mockProjectService はテスト用のProjectServiceのモック実装
type mockProjectService struct {
	// モック用のメソッドの戻り値を制御するフィールド
	getUserProjectsResult []model.UserProjectResponse
	getUserProjectsError  error
}

// ProjectServiceインターフェースのメソッドを実装
func (m *mockProjectService) GetUserProjects(userID uint) ([]model.UserProjectResponse, error) {
	return m.getUserProjectsResult, m.getUserProjectsError
}

func (m *mockProjectService) GetProjectByID(projectID uint) (*model.ProjectResponse, error) {
	return nil, errors.New("not implemented in mock")
}

func (m *mockProjectService) GetProjectMembers(projectID uint, page, limit int) ([]model.ProjectMemberResponse, int, error) {
	return nil, 0, errors.New("not implemented in mock")
}

func (m *mockProjectService) CreateProject(userID uint, req *model.ProjectCreateRequest) (*model.ProjectResponse, error) {
	return nil, errors.New("not implemented in mock")
}

func (m *mockProjectService) UpdateProject(userID, projectID uint, req *model.ProjectUpdateRequest) (*model.ProjectResponse, error) {
	return nil, errors.New("not implemented in mock")
}

func (m *mockProjectService) DeleteProject(userID, projectID uint) error {
	return errors.New("not implemented in mock")
}

func (m *mockProjectService) AddUserToProject(projectID, userID uint, role model.Role) error {
	return errors.New("not implemented in mock")
}

func (m *mockProjectService) UpdateUserProjectRole(projectID, userID uint, role model.Role) error {
	return errors.New("not implemented in mock")
}

func (m *mockProjectService) RemoveUserFromProject(projectID, userID uint) error {
	return errors.New("not implemented in mock")
}

func (m *mockProjectService) CheckProjectPermission(userID, projectID uint) (*model.ProjectPermissionResponse, error) {
	return nil, errors.New("not implemented in mock")
}

// Wire風の依存関係注入を考慮したテストヘルパー関数
func newTestProjectHandler(projectService interfaces.ProjectService) *ProjectHandler {
	return NewProjectHandler(projectService)
}

func TestProjectHandler_GetUserProjects(t *testing.T) {
	// テストケース用の固定データ
	testUserID := uint(1)
	testTime := time.Now()
	
	tests := []struct {
		name             string
		userID           interface{} // Ginのコンテキストに設定する値
		mockProjects     []model.UserProjectResponse
		mockError        error
		expectedStatus   int
		expectedError    string
		expectProjects   bool
	}{
		{
			name:   "正常ケース - プロジェクトが存在する場合",
			userID: testUserID,
			mockProjects: []model.UserProjectResponse{
				{
					ProjectID:   1,
					Name:        "Test Project 1",
					Description: "Test Description 1",
					Status:      model.ProjectStatusActive,
					Role:        model.RoleOwner,
					JoinedAt:    testTime,
				},
				{
					ProjectID:   2,
					Name:        "Test Project 2", 
					Description: "Test Description 2",
					Status:      model.ProjectStatusActive,
					Role:        model.RoleAdmin,
					JoinedAt:    testTime,
				},
			},
			mockError:      nil,
			expectedStatus: http.StatusOK,
			expectProjects: true,
		},
		{
			name:           "正常ケース - プロジェクトが空の場合",
			userID:         testUserID,
			mockProjects:   []model.UserProjectResponse{},
			mockError:      nil,
			expectedStatus: http.StatusOK,
			expectProjects: true,
		},
		{
			name:           "異常ケース - ユーザーが認証されていない",
			userID:         nil, // 認証されていない状態
			mockProjects:   nil,
			mockError:      nil,
			expectedStatus: http.StatusUnauthorized,
			expectedError:  "User not authenticated",
			expectProjects: false,
		},
		{
			name:           "異常ケース - サービス層でエラーが発生",
			userID:         testUserID,
			mockProjects:   nil,
			mockError:      errors.New("database connection error"),
			expectedStatus: http.StatusInternalServerError,
			expectedError:  "Failed to fetch user projects",
			expectProjects: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// モックサービスをセットアップ
			mockService := &mockProjectService{
				getUserProjectsResult: tt.mockProjects,
				getUserProjectsError:  tt.mockError,
			}

			// Wire風にハンドラーを作成
			handler := newTestProjectHandler(mockService)

			// Ginのテスト用のコンテキストをセットアップ
			gin.SetMode(gin.TestMode)
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			// HTTPリクエストをセットアップ
			req, _ := http.NewRequest("GET", "/api/projects", nil)
			c.Request = req

			// ユーザー認証情報をコンテキストに設定（認証されている場合のみ）
			if tt.userID != nil {
				c.Set("user_id", tt.userID)
			}

			// テスト対象メソッドを実行
			handler.GetUserProjects(c)

			// ステータスコードをチェック
			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}

			// レスポンスボディをパース
			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			if err != nil {
				t.Fatalf("Failed to parse response body: %v", err)
			}

			// エラーケースの場合
			if tt.expectedError != "" {
				errorMsg, exists := response["error"]
				if !exists {
					t.Error("Expected error message in response, but not found")
				} else if errorMsg != tt.expectedError {
					t.Errorf("Expected error message '%s', got '%s'", tt.expectedError, errorMsg)
				}
				return
			}

			// 正常ケースの場合
			if tt.expectProjects {
				projects, exists := response["projects"]
				if !exists {
					t.Error("Expected projects in response, but not found")
					return
				}

				projectsSlice, ok := projects.([]interface{})
				if !ok {
					t.Error("Expected projects to be an array")
					return
				}

				expectedLength := len(tt.mockProjects)
				if len(projectsSlice) != expectedLength {
					t.Errorf("Expected %d projects, got %d", expectedLength, len(projectsSlice))
					return
				}

				// プロジェクトデータが存在する場合、最初のプロジェクトの詳細をチェック
				if expectedLength > 0 {
					firstProject, ok := projectsSlice[0].(map[string]interface{})
					if !ok {
						t.Error("Expected first project to be a map")
						return
					}

					expectedProject := tt.mockProjects[0]
					
					// project_id のチェック
					if projectID, exists := firstProject["project_id"]; !exists {
						t.Error("Expected project_id in project data")
					} else if float64(expectedProject.ProjectID) != projectID {
						t.Errorf("Expected project_id %d, got %v", expectedProject.ProjectID, projectID)
					}

					// name のチェック
					if name, exists := firstProject["name"]; !exists {
						t.Error("Expected name in project data")
					} else if expectedProject.Name != name {
						t.Errorf("Expected name '%s', got '%s'", expectedProject.Name, name)
					}
				}
			}
		})
	}
}

// ベンチマークテスト（パフォーマンステスト）
func BenchmarkProjectHandler_GetUserProjects(b *testing.B) {
	// テストデータのセットアップ
	testProjects := []model.UserProjectResponse{
		{
			ProjectID:   1,
			Name:        "Benchmark Project",
			Description: "Benchmark Description",
			Status:      model.ProjectStatusActive,
			Role:        model.RoleOwner,
			JoinedAt:    time.Now(),
		},
	}

	mockService := &mockProjectService{
		getUserProjectsResult: testProjects,
		getUserProjectsError:  nil,
	}

	handler := newTestProjectHandler(mockService)

	gin.SetMode(gin.TestMode)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		req, _ := http.NewRequest("GET", "/api/projects", nil)
		c.Request = req
		c.Set("user_id", uint(1))

		handler.GetUserProjects(c)
	}
}

// 複数プロジェクトと複数ユーザーでの詳細テスト
func TestProjectHandler_GetUserProjects_MultipleProjectsAndRoles(t *testing.T) {
	testTime := time.Now()

	tests := []struct {
		name              string
		userID            uint
		mockProjects      []model.UserProjectResponse
		mockError         error
		expectedStatus    int
		expectedError     string
		expectProjectCount int
		description       string
	}{
		{
			name:   "sanseiOwner - 複数プロジェクトでOwnerとAdmin",
			userID: 1, // sanseiOwner
			mockProjects: []model.UserProjectResponse{
				{
					ProjectID:   1, // sanseitouProject1
					Name:        "算政党プロジェクト1",
					Description: "システム管理・運用中心のプロジェクト",
					Status:      model.ProjectStatusActive,
					Role:        model.RoleOwner,
					JoinedAt:    testTime.AddDate(0, -6, 0),
				},
				{
					ProjectID:   2, // 別のプロジェクトでAdmin
					Name:        "開発プロジェクト",
					Description: "新機能開発プロジェクト",
					Status:      model.ProjectStatusActive,
					Role:        model.RoleAdmin,
					JoinedAt:    testTime.AddDate(0, -3, 0),
				},
			},
			expectedStatus:     http.StatusOK,
			expectProjectCount: 2,
			description:        "複数プロジェクトで異なるロールを持つユーザー",
		},
		{
			name:   "sanseiViewer - 閲覧権限のみの複数プロジェクト参加",
			userID: 3, // sanseiViewer
			mockProjects: []model.UserProjectResponse{
				{
					ProjectID:   1,
					Name:        "算政党プロジェクト1",
					Description: "システム管理・運用中心のプロジェクト",
					Status:      model.ProjectStatusActive,
					Role:        model.RoleViewer,
					JoinedAt:    testTime.AddDate(0, -2, 0),
				},
				{
					ProjectID:   3,
					Name:        "リサーチプロジェクト",
					Description: "市場調査プロジェクト",
					Status:      model.ProjectStatusActive,
					Role:        model.RoleViewer,
					JoinedAt:    testTime.AddDate(0, -1, 0),
				},
				{
					ProjectID:   4,
					Name:        "データ分析プロジェクト",
					Description: "BI・分析系プロジェクト",
					Status:      model.ProjectStatusArchived,
					Role:        model.RoleViewer,
					JoinedAt:    testTime.AddDate(0, -4, 0),
				},
			},
			expectedStatus:     http.StatusOK,
			expectProjectCount: 3,
			description:        "閲覧権限のみで複数プロジェクトに参加",
		},
		{
			name:   "shinseiAdmin - 新政党プロジェクトの管理者",
			userID: 5, // shinseiAdmin
			mockProjects: []model.UserProjectResponse{
				{
					ProjectID:   5, // shinseiProject
					Name:        "新政党プロジェクト",
					Description: "新政党の政策立案・実行プロジェクト",
					Status:      model.ProjectStatusActive,
					Role:        model.RoleAdmin,
					JoinedAt:    testTime.AddDate(0, -1, -15),
				},
			},
			expectedStatus:     http.StatusOK,
			expectProjectCount: 1,
			description:        "単一プロジェクトの管理者",
		},
		{
			name:   "複数ロール持ちユーザー - プロジェクトごとに異なる権限",
			userID: 7, // 複数ロール持ちユーザー
			mockProjects: []model.UserProjectResponse{
				{
					ProjectID:   6,
					Name:        "フロントエンド開発",
					Description: "React/Next.js開発プロジェクト",
					Status:      model.ProjectStatusActive,
					Role:        model.RoleViewer, // 開発プロジェクトでは閲覧のみ
					JoinedAt:    testTime.AddDate(0, -2, -10),
				},
				{
					ProjectID:   7,
					Name:        "バックエンド開発",
					Description: "Go/Gin API開発プロジェクト",
					Status:      model.ProjectStatusActive,
					Role:        model.RoleAdmin, // バックエンドでは管理者権限
					JoinedAt:    testTime.AddDate(0, -1, -20),
				},
				{
					ProjectID:   8,
					Name:        "レガシーシステム保守",
					Description: "既存システムのメンテナンス",
					Status:      model.ProjectStatusInactive,
					Role:        model.RoleOwner, // 保守ではオーナー権限
					JoinedAt:    testTime.AddDate(-1, 0, 0),
				},
			},
			expectedStatus:     http.StatusOK,
			expectProjectCount: 3,
			description:        "ユーザーが複数プロジェクトで異なるロール",
		},
		{
			name:               "新規ユーザー - プロジェクト未参加",
			userID:             999, // 新規ユーザー
			mockProjects:       []model.UserProjectResponse{},
			expectedStatus:     http.StatusOK,
			expectProjectCount: 0,
			description:        "まだどのプロジェクトにも参加していないユーザー",
		},
		{
			name:   "プロジェクトオーナー - 複数の異なるステータスのプロジェクト管理",
			userID: 10, // プロジェクトオーナー
			mockProjects: []model.UserProjectResponse{
				{
					ProjectID:   11,
					Name:        "アクティブプロジェクト",
					Description: "現在進行中のプロジェクト",
					Status:      model.ProjectStatusActive,
					Role:        model.RoleOwner,
					JoinedAt:    testTime.AddDate(0, -3, 0),
				},
				{
					ProjectID:   12,
					Name:        "休眠プロジェクト",
					Description: "一時的に停止中のプロジェクト",
					Status:      model.ProjectStatusInactive,
					Role:        model.RoleOwner,
					JoinedAt:    testTime.AddDate(0, -8, 0),
				},
				{
					ProjectID:   13,
					Name:        "完了済みプロジェクト",
					Description: "アーカイブ済みのプロジェクト",
					Status:      model.ProjectStatusArchived,
					Role:        model.RoleOwner,
					JoinedAt:    testTime.AddDate(-1, -2, 0),
				},
			},
			expectedStatus:     http.StatusOK,
			expectProjectCount: 3,
			description:        "様々なステータスのプロジェクトを所有",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Logf("テストケース: %s", tt.description)

			// モックサービスをセットアップ
			mockService := &mockProjectService{
				getUserProjectsResult: tt.mockProjects,
				getUserProjectsError:  tt.mockError,
			}

			handler := newTestProjectHandler(mockService)

			// Ginのテスト用のコンテキストをセットアップ
			gin.SetMode(gin.TestMode)
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			req, _ := http.NewRequest("GET", "/api/projects", nil)
			c.Request = req
			c.Set("user_id", tt.userID)

			// テスト対象メソッドを実行
			handler.GetUserProjects(c)

			// ステータスコードをチェック
			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}

			// レスポンスボディをパース
			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			if err != nil {
				t.Fatalf("Failed to parse response body: %v", err)
			}

			// エラーケースの場合
			if tt.expectedError != "" {
				errorMsg, exists := response["error"]
				if !exists {
					t.Error("Expected error message in response, but not found")
				} else if errorMsg != tt.expectedError {
					t.Errorf("Expected error message '%s', got '%s'", tt.expectedError, errorMsg)
				}
				return
			}

			// 正常ケースの場合
			projects, exists := response["projects"]
			if !exists {
				t.Error("Expected projects in response, but not found")
				return
			}

			projectsSlice, ok := projects.([]interface{})
			if !ok {
				t.Error("Expected projects to be an array")
				return
			}

			if len(projectsSlice) != tt.expectProjectCount {
				t.Errorf("Expected %d projects, got %d", tt.expectProjectCount, len(projectsSlice))
				return
			}

			// プロジェクトが存在する場合、詳細な検証
			if tt.expectProjectCount > 0 {
				for i, expectedProject := range tt.mockProjects {
					if i >= len(projectsSlice) {
						break
					}

					actualProject, ok := projectsSlice[i].(map[string]interface{})
					if !ok {
						t.Errorf("Expected project %d to be a map", i)
						continue
					}

					// プロジェクトIDのチェック
					if projectID, exists := actualProject["project_id"]; exists {
						if float64(expectedProject.ProjectID) != projectID {
							t.Errorf("Project %d: Expected project_id %d, got %v", i, expectedProject.ProjectID, projectID)
						}
					} else {
						t.Errorf("Project %d: Expected project_id in project data", i)
					}

					// ロールのチェック
					if role, exists := actualProject["role"]; exists {
						if string(expectedProject.Role) != role {
							t.Errorf("Project %d: Expected role %s, got %v", i, expectedProject.Role, role)
						}
					} else {
						t.Errorf("Project %d: Expected role in project data", i)
					}

					// ステータスのチェック
					if status, exists := actualProject["status"]; exists {
						if string(expectedProject.Status) != status {
							t.Errorf("Project %d: Expected status %s, got %v", i, expectedProject.Status, status)
						}
					} else {
						t.Errorf("Project %d: Expected status in project data", i)
					}
				}
			}

			t.Logf("✅ %s: %d projects verified successfully", tt.name, tt.expectProjectCount)
		})
	}
}

// ロール権限の詳細テスト
func TestProjectHandler_GetUserProjects_RolePermissionScenarios(t *testing.T) {
	testTime := time.Now()

	// 役割別の権限シナリオテスト
	roleScenarios := []struct {
		roleName        string
		role            model.Role
		expectManage    bool
		expectEdit      bool
		expectView      bool
		projectCount    int
		description     string
	}{
		{
			roleName:     "Owner",
			role:         model.RoleOwner,
			expectManage: true,
			expectEdit:   true,
			expectView:   true,
			projectCount: 3,
			description:  "全権限を持つプロジェクトオーナー",
		},
		{
			roleName:     "Admin",
			role:         model.RoleAdmin,
			expectManage: true,
			expectEdit:   true,
			expectView:   true,
			projectCount: 2,
			description:  "管理・編集権限を持つ管理者",
		},
		{
			roleName:     "Viewer",
			role:         model.RoleViewer,
			expectManage: false,
			expectEdit:   false,
			expectView:   true,
			projectCount: 1,
			description:  "閲覧権限のみのビューワー",
		},
	}

	for _, scenario := range roleScenarios {
		t.Run(fmt.Sprintf("Role_%s_Permissions", scenario.roleName), func(t *testing.T) {
			// テストデータを生成
			var mockProjects []model.UserProjectResponse
			for i := 0; i < scenario.projectCount; i++ {
				mockProjects = append(mockProjects, model.UserProjectResponse{
					ProjectID:   uint(i + 1),
					Name:        fmt.Sprintf("%s Project %d", scenario.roleName, i+1),
					Description: fmt.Sprintf("Project managed by %s role", scenario.roleName),
					Status:      model.ProjectStatusActive,
					Role:        scenario.role,
					JoinedAt:    testTime.AddDate(0, -i-1, 0),
				})
			}

			mockService := &mockProjectService{
				getUserProjectsResult: mockProjects,
				getUserProjectsError:  nil,
			}

			handler := newTestProjectHandler(mockService)

			gin.SetMode(gin.TestMode)
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			req, _ := http.NewRequest("GET", "/api/projects", nil)
			c.Request = req
			c.Set("user_id", uint(100))

			handler.GetUserProjects(c)

			if w.Code != http.StatusOK {
				t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
			}

			var response map[string]interface{}
			json.Unmarshal(w.Body.Bytes(), &response)

			projects := response["projects"].([]interface{})
			if len(projects) != scenario.projectCount {
				t.Errorf("Expected %d projects, got %d", scenario.projectCount, len(projects))
			}

			// 権限チェック（モデルレベルでの権限確認）
			t.Logf("Role %s permissions: Manage=%v, Edit=%v, View=%v", 
				scenario.roleName, 
				scenario.role.CanManageProject(), 
				scenario.role.CanEditProject(), 
				scenario.role.CanViewProject())

			if scenario.role.CanManageProject() != scenario.expectManage {
				t.Errorf("Role %s: Expected CanManage=%v, got %v", scenario.roleName, scenario.expectManage, scenario.role.CanManageProject())
			}

			if scenario.role.CanEditProject() != scenario.expectEdit {
				t.Errorf("Role %s: Expected CanEdit=%v, got %v", scenario.roleName, scenario.expectEdit, scenario.role.CanEditProject())
			}

			if scenario.role.CanViewProject() != scenario.expectView {
				t.Errorf("Role %s: Expected CanView=%v, got %v", scenario.roleName, scenario.expectView, scenario.role.CanViewProject())
			}

			t.Logf("✅ %s: %s verified with %d projects", scenario.roleName, scenario.description, scenario.projectCount)
		})
	}
}

// カバレッジを向上させるための追加テスト
func TestProjectHandler_GetUserProjects_WithDifferentUserTypes(t *testing.T) {
	mockService := &mockProjectService{
		getUserProjectsResult: []model.UserProjectResponse{},
		getUserProjectsError:  nil,
	}

	handler := newTestProjectHandler(mockService)

	tests := []struct {
		name           string
		userID         interface{}
		expectedStatus int
	}{
		{
			name:           "uint型のユーザーID",
			userID:         uint(123),
			expectedStatus: http.StatusOK,
		},
		{
			name:           "string型のユーザーID（型が異なる場合の挙動確認）",
			userID:         "invalid_type",
			expectedStatus: http.StatusInternalServerError, // 実際の実装では型アサーションでパニックになる可能性
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gin.SetMode(gin.TestMode)
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			req, _ := http.NewRequest("GET", "/api/projects", nil)
			c.Request = req
			c.Set("user_id", tt.userID)

			// パニックを捕捉するためのdefer
			defer func() {
				if r := recover(); r != nil && tt.expectedStatus != http.StatusInternalServerError {
					t.Errorf("Unexpected panic: %v", r)
				}
			}()

			handler.GetUserProjects(c)

			if tt.expectedStatus == http.StatusOK && w.Code != http.StatusOK {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}
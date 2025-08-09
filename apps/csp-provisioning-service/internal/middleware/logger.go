package middleware

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

// Logger はカスタムログミドルウェア
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		// リクエストを処理
		c.Next()

		// ログ出力
		end := time.Now()
		latency := end.Sub(start)
		clientIP := c.ClientIP()
		method := c.Request.Method
		statusCode := c.Writer.Status()
		bodySize := c.Writer.Size()

		if raw != "" {
			path = path + "?" + raw
		}

		log.Printf("[CSP-PROVISIONING] %v | %3d | %13v | %15s | %-7s %#v | %d",
			end.Format("2006/01/02 - 15:04:05"),
			statusCode,
			latency,
			clientIP,
			method,
			path,
			bodySize,
		)
	}
}

# 层叠成钥：可重构超表面加密仿真

这是一个可直接部署到 GitHub Pages 的纯前端教学仿真网页。它参考 Park *et al.* 的模块化衍射深度神经网络（MD²NN）思路，演示“波长 × 层组合 × 层间距”共同构成密钥时，图像信息如何被选择性读取。

## 可以操作的密钥

- 选择 450、550 或 650 nm 入射波长；
- 选择单独使用 **MS₁**、单独使用 **MS₂**，或将两层同时级联；
- 在两层同时参与时，以层间距作为连续密钥。默认正确距离为 500 μm；
- 点击“错误密钥”可快速观察失配后输出退化。

网页在浏览器内生成目标场、带相位扰动的接收场、强度分布、MSE、相关系数和距离容差曲线；不上传操作数据。

## 模型边界

本网页是依据论文工作流建立的**教学型数值仿真**：用复振幅编码和与自由空间传播相位相对应的近似来显示密钥匹配/失配的影响。它不包含论文的训练后纳米结构相位版图，因此不能替代论文中的全波仿真、神经网络训练或实验测量。

论文的理论组合数为：

<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>m</mi><mo>(</mo><msup><mn>2</mn><mi>N</mi></msup><mo>−</mo><mn>1</mn><mo>)</mo></math>

其中 <i>m</i> 为波长数，<i>N</i> 为超表面层数。本站采用 <i>m</i> = 3、<i>N</i> = 2，因此可展示 9 个离散的“波长—层组合”通道，再叠加层间距这一连续密钥。

## 本地运行

需要 Node.js 18 或更高版本：

```powershell
node server.cjs
```

打开 `http://127.0.0.1:4179`。运行 `node tests/smoke.cjs` 可检查页面核心文件与字体配置。

## 参考论文

J. Park *et al.*, “Recomposable Layered Metasurfaces for Wavelength-Multiplexed Optical Encryption via Modular Diffractive Deep Neural Networks,” *Advanced Functional Materials* **36** (2026), e23309. https://doi.org/10.1002/adfm.202523309

论文为开放获取（CC BY-NC）。本项目仅作学习与展示使用。

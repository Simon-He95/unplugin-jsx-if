import type { JSXAttribute } from '@babel/types'
import type { ParserOptions } from '@babel/parser'
import { parse } from '@babel/parser'
import { isJSXAttribute, isJSXText, traverse } from '@babel/types'
import { createUnplugin } from 'unplugin'
import type { UnpluginFactory } from 'unplugin'
import type { Options } from './types'
import { PLUGIN_NAME } from './constant'

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options) => {
  const { prefix = 'v', transformInclude = (id: string) => id.endsWith('.tsx') } = options || {}
  const IF = `${prefix}-if`
  const ELSEIF = new RegExp(`${prefix}-else(?:-if)?$`)
  return [{
    name: PLUGIN_NAME,
    enforce: 'pre',
    transformInclude,
    transform(code: string) {
      try {
        const ast = parserJSX(code) as any
        traverse(ast, {
          enter(node: any, parentNodes: any) {
            if (node.type !== 'JSXElement')
              return
            if (node.openingElement.attributes.length) {
              const vIf = node.openingElement.attributes.find(
                (attr: any) => isJSXAttribute(attr) && attr.name.name === IF,
              ) as JSXAttribute
              if (!vIf || !vIf.value)
                return
              const siblings = (
                parentNodes.slice(-1)[0]?.node as any
              ).children.filter((i: any) => !isJSXText(i) || i.value.trim())
              const vIfExpression = code.slice(
                vIf.value.loc!.start.index + 1,
                vIf.value.loc!.end.index - 1,
              )
              const vIfGroup = code.slice(
                vIf.loc?.start.index,
                vIf.loc?.end.index,
              )
              const nodeContent = code
                .slice(node.loc?.start.index, node.loc?.end.index)
                .replace(vIfGroup, '')
              const vIfLists = [[vIfExpression, nodeContent, node]]
              if (!siblings) {
                code = `${code.slice(
                  0,
                  node.loc?.start.index,
                )}{${vIfExpression} ? ${nodeContent} : null}${code.slice(
                  node.loc?.end.index,
                )}`
              }
              else {
                const currentIndex = siblings.findIndex(
                  (sibling: any) => sibling === node,
                )
                const nextSiblings = siblings.slice(currentIndex + 1)
                let nextSibling
                let nextSiblingVElseIf

                // eslint-disable-next-line no-cond-assign
                while ((nextSibling = nextSiblings.splice(0, 1)[0])) {
                  nextSiblingVElseIf
                    = nextSibling.openingElement?.attributes.find(
                      (attr: any) =>
                        isJSXAttribute(attr)
                        && ELSEIF.test(attr.name.name as string),
                    )
                  if (nextSiblingVElseIf) {
                    const vIfExpression = nextSiblingVElseIf.value
                      ? code.slice(
                        nextSiblingVElseIf.value.loc!.start.index + 1,
                        nextSiblingVElseIf.value.loc!.end.index - 1,
                      )
                      : ''
                    const vIfGroup = code.slice(
                      nextSiblingVElseIf.loc?.start.index,
                      nextSiblingVElseIf.loc?.end.index,
                    )
                    const nodeContent = code
                      .slice(
                        nextSibling.loc?.start.index,
                        nextSibling.loc?.end.index,
                      )
                      .replace(vIfGroup, '')
                    vIfLists.push([vIfExpression, nodeContent, nextSibling])
                  }
                  else {
                    break
                  }
                }
                // 将第一个开始和最后一个结束转换成 三元表达式
                const [firstExpression, firstNodeContent] = vIfLists.shift()!
                const [_, lastNodeContent, lastNode] = vIfLists.pop()!
                let ternaryExpression = `{${firstExpression} ? ${firstNodeContent}`
                for (const [vIfExpression, nodeContent] of vIfLists)
                  ternaryExpression += ` : ${vIfExpression} ? ${nodeContent}`

                ternaryExpression += ` : ${lastNodeContent}}`
                code
                  = code.slice(0, node.loc?.start.index)
                  + ternaryExpression
                  + code.slice((lastNode as any).loc?.end.index)
              }
            }
          },
        })
        return code
      }
      catch (error) {
        console.error(error)
      }
    },
  }]
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin

function parserJSX(code: string) {
  const finalOptions: ParserOptions = {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
    errorRecovery: true,
  }
  try {
    return parse(code, finalOptions)
  }
  catch (err) {
    console.error(err)
    return parse('', finalOptions)
  }
}

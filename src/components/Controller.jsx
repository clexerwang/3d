import React from 'react';
import { Form, Select, Input, Button, message } from 'antd';
import { fetchAllTypes } from '../services/controller';
import GoodsList from "./GoodsList.jsx";
import SearchGoods from "./SearchGoods.jsx";
const formItemLayout = {
    labelCol: {
        xs: { span: 24 },
        sm: { span: 8 },
    },
    wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 },
    },
};

const { Option } = Select;
class Controller extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            allTypes: ['变压器', '输电线', '绝缘子', '输电桩', '滤波器', '保险栓']
        };
    }

/*    componentDidMount = async() => {
        try {
            const allTypes = await fetchAllTypes();
            this.setState({
                allTypes
            })
        } catch(error) {
            console.log(eror);
        }
    };*/

    handleSubmit = (e) => {
        e.preventDefault();

        this.props.form.validateFields((err, values) => {
            message.error('添加错误,请检查网络');
        })
    };
    render() {
        const { getFieldDecorator } = this.props.form;
        const { allTypes } = this.state;
        return (
            <div className='controller-input'>
                <Form onSubmit={this.handleSubmit} { ...formItemLayout }>
                    <Form.Item label="物资类型">
                        {getFieldDecorator('type', {
                                rules:[{
                                    required: true,
                                    message: '请选择物资类型'
                                }]
                            })(
                                <Select>
                                    {allTypes.map((type) => {
                                        return <Option key={type}>{type}</Option>
                                    })}
                                </Select>
                        )}
                    </Form.Item>
                    <Form.Item label="物资长度">
                        {getFieldDecorator('long', {
                                rules: [{
                                    required: true,
                                    message: '请输入物资的长度信息'
                                }]
                            })(<Input />)
                        }
                    </Form.Item>
                    <Form.Item label="物资高度">
                        {
                            getFieldDecorator('width', {
                                initialValue: '',
                                rules: [{
                                    required: true,
                                    message: '请输入物资的高度信息'
                                }]
                            })(
                                <Input/>
                            )
                        }
                    </Form.Item>
                    <Form.Item label="物资宽度">
                        {
                            getFieldDecorator('height', {
                                initialValue: '',
                                rules: [{
                                    required: true,
                                    message: '请输入物资的宽度信息'
                                }]
                            })(
                                <Input>

                                </Input>
                            )
                        }
                    </Form.Item>
                    <Form.Item label="物资编号">
                        {getFieldDecorator('id', {
                            initialValue: '',
                                rules: [{
                                    required: true,
                                    message: '请输入物资的长度信息'
                                }]
                            })(
                                <Input>

                                </Input>
                            )
                        }
                    </Form.Item>
                    <Form.Item label="物资编号">
                        {getFieldDecorator('size', {
                            initialValue: '',
                            rules: [{
                                required: true,
                                message: '请选择物资的体积信息'
                            }]
                        })(
                            <Select>
                                <Option key={'s'}>小</Option>
                                <Option key={'l'}>大</Option>
                            </Select>
                        )
                        }
                    </Form.Item>
                    <Form.Item>
                        <Button type='primary' htmlType='submit'>
                            提交
                        </Button>
                    </Form.Item>
                </Form>
                <SearchGoods />
                <GoodsList/>
            </div>
        )
    }
}

export default Form.create({})(Controller);